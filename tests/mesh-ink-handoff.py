"""Format integration check; takes local winding-field-cli and ink-sdk source paths."""
import json
from pathlib import Path
import sys
import tempfile

sys.path[:0] = [str(Path(p).resolve() / 'src') for p in sys.argv[1:3]]
import numpy as np
import zarr
from winding_field.original_tifxyz import export_xyz
from ink_sdk.registry import get_profile
from ink_sdk.resolver import build_segment, with_render_spec
from ink_sdk.contracts import RunContext
from ink_sdk.renderers.vc_render_tifxyz import VcRenderTifxyzRenderer, _mesh_arrays

settings = json.loads((Path(__file__).resolve().parent.parent / 'dist/examples/paris4-flattening.json').read_text())
with tempfile.TemporaryDirectory(prefix='mesh-ink-handoff-') as temporary:
    root = Path(temporary)
    y, x = np.mgrid[:12, :12]
    xyz = np.stack([20. + x, 31. - y, np.full_like(x, 30.)], axis=-1)
    mask = np.ones((12, 12), np.uint8)
    faces = np.array([[0, 1, 2], [1, 3, 2]])
    uv = np.array([[0., 0.], [11., 0.], [0., 11.], [11., 11.]])
    pitch = settings['pitch_um'] / settings['output_frame']['voxel_um']
    assert pitch == 1.
    result = export_xyz(root/'tifxyz', xyz, mask, faces, uv, np.ones(2, bool),
                        dict(pitch=pitch, u0=0., v_top=11.), settings['output_frame'])
    assert result['retained_cells'] > 0
    meta = json.loads((root/'tifxyz/meta.json').read_text())
    assert meta['scale'] == [1., 1.] and meta['pitch_um'] == 9.6
    ct = zarr.open_group(str(root/'ct.zarr'), mode='w', zarr_format=2)
    ct.create_array('0', data=np.full((64,64,64), 100, np.uint8), chunks=(16,16,16))
    ct.attrs.update({'pixel_um':[9.6,9.6,9.6], 'multiscales':[{'datasets':[{'path':'0','coordinateTransformations':[{'type':'scale','scale':[9.6,9.6,9.6]}]}]}]})
    profile = get_profile('ink_9um@scrollprize-seed43-step75000')
    ctx = RunContext()
    segment = build_segment(profile=profile, ctx=ctx, tifxyz=root/'tifxyz', ct=root/'ct.zarr', voxel_um=9.6)
    segment = with_render_spec(segment, profile, ctx)
    issues = VcRenderTifxyzRenderer().check(segment, profile)
    assert {i.code for i in issues if i.is_error} == {'missing-renderer'}, issues
    assert segment.render.num_slices == 17
    assert segment.pixel_um == (9.6,9.6,9.6)
    arrays = _mesh_arrays(root/'tifxyz')
    assert all(a.shape == (12,12) for a in arrays)
    assert profile.execution.direction == 'both'
print('Passed: real CLI-exported float32 TIFXYZ passes ink-sdk mesh/CT data checks (external renderer remains required) at the same 9.6 µm frame; 17-slice, both-direction render plan. No external rendering or model inference executed.')
