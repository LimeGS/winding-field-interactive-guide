"""Copy only the CT chunks an exported TIFXYZ tile needs, as a local OME-Zarr for ink-sdk.

ink-sdk renders from local CT, but the whole 9.6 um level of PHerc. Paris 4 is about 1.3 TB.
This keeps the remote array's shape, chunking and indices, so the tile's coordinates stay valid,
and downloads only the chunks within MARGIN voxels of the surface (about 0.2 GB for one tile).
Chunks that are not copied read as zero. The CT address comes from the tile's own meta.json.

usage: python sparse-ct.py TILE_DIR OUT.zarr [MARGIN_VOXELS]   (needs numpy and tifffile)
"""
import concurrent.futures
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

import numpy as np
import tifffile

tile, out = Path(sys.argv[1]), Path(sys.argv[2])
margin = int(sys.argv[3]) if len(sys.argv) > 3 else 24
binding = json.loads((tile / 'meta.json').read_text())['source_binding']['ct']
base = binding['source'].rstrip('/')
if base.startswith('s3://'):
    bucket, _, key = base[5:].partition('/')
    base = f'https://{bucket}.s3.amazonaws.com/{key}'
voxel_um = binding['spacing_xyz'][0]

zarray = json.loads(urllib.request.urlopen(f'{base}/.zarray', timeout=120).read())
shape, chunk = zarray['shape'], zarray['chunks']
separator = zarray.get('dimension_separator', '.')
x, y, z = (tifffile.imread(tile / f'{axis}.tif').astype(np.float64) for axis in 'xyz')
valid = (x >= 0) & (y >= 0) & (z >= 0) & np.isfinite(x + y + z)
points = np.stack([z[valid], y[valid], x[valid]], axis=1)  # ZYX voxel indices
needed = set()
for dz in (-margin, 0, margin):
    for dy in (-margin, 0, margin):
        for dx in (-margin, 0, margin):
            keys = np.floor((points + [dz, dy, dx]) / chunk).astype(int)
            needed.update(map(tuple, np.unique(keys, axis=0)))
needed = sorted(k for k in needed if all(0 <= k[i] * chunk[i] < shape[i] for i in range(3)))
print(f'{int(valid.sum())} surface points; {len(needed)} chunks '
      f'(about {len(needed) * int(np.prod(chunk)) / 1e9:.2f} GB) from {base}')

array = out / '0'
array.mkdir(parents=True, exist_ok=True)
(array / '.zarray').write_text(json.dumps(zarray, indent=1))
(out / '.zgroup').write_text(json.dumps({'zarr_format': 2}))
(out / '.zattrs').write_text(json.dumps({
    'pixel_um': [voxel_um] * 3,
    'multiscales': [{'version': '0.4',
                     'axes': [{'name': a, 'type': 'space', 'unit': 'micrometer'} for a in 'zyx'],
                     'datasets': [{'path': '0', 'coordinateTransformations': [
                         {'type': 'scale', 'scale': [voxel_um] * 3}]}]}]}, indent=1))


def fetch(key):
    name = separator.join(map(str, key))
    target = array / name
    if target.exists():
        return 0
    try:
        data = urllib.request.urlopen(f'{base}/{name}', timeout=120).read()
    except urllib.error.HTTPError as error:
        if error.code in (403, 404):  # never written upstream: reads as the fill value
            return 0
        raise
    target.parent.mkdir(parents=True, exist_ok=True)
    partial = target.with_name(target.name + '.part')
    partial.write_bytes(data)
    partial.replace(target)
    return len(data)


total = 0
with concurrent.futures.ThreadPoolExecutor(16) as pool:
    for done, size in enumerate(pool.map(fetch, needed), 1):
        total += size
        if done % 100 == 0 or done == len(needed):
            print(f'  {done}/{len(needed)} chunks, {total / 1e9:.2f} GB', flush=True)
print(f'Wrote {out}: {voxel_um} um, shape {shape}, {len(needed)} chunks present.')
