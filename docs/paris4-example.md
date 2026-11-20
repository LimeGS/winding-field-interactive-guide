# Published Paris 4 mesh and flattening example

Replaces the PHerc1447 field-fitting builder. The default workflow reads an existing 307.2 µm field, extracts W = −60, then exports CT images and mesh-derived XYZ TIFFs with explicit LSCM / sheet scope. The synthetic demo and ink-sdk workbench remain available.

Verified against winding-field-cli `ff588ae7ce6e73b6ede36ef96a629adeea88a58e` (1.5.6): `examples/paris4-remote.json`, `docs/PREPARED.md`, `docs/FLATTENING.md`, parser in `src/winding_field/cli.py`, and matrix settings. The mesh config is an unchanged copy of the official example. Download both configs from the workbench into the working directory. This export path requires Linux and an installed CLI.

The field URL pins dataset revision `6753c9812ec8c455401da69b4e758769e565e39f`, field SHA `8f148279de9fc0bc9a877c84e3209a7d0bda8d17cd9d7175820ce075512835be`, and completion SHA `57df0ad0358b3f6963b165fd155f91b22da2d37f3d8b996e6a018afd7dc133e9`. Use stored support: observed is an unavailable-support sentinel. Raw phi −71.54987931251526 is nominal W −60 with sheet_step 1.192497988541921. These are candidate surfaces, not certified physical sheets.

Matching CT: `s3://vesuvius-challenge-open-data/PHercParis4/volumes/20260411134726-2.400um-0.2m-78keV-masked.zarr`, native scale 2.4 µm. The current command addresses the `/2` array directly with `--voxel-um 9.6 --level 0`. Its direct-array geometry is identical to selecting level 2 of the parent with a 2.4 µm native scale. The field frame also uses 9.6 µm coordinate units, while its grid spacing is 32 units = 307.2 µm. Output frame uses 9.6 µm units and raster pitch 9.6 µm; this does not refine the source geometry. CT source and level were checked against the official ink-detection tutorial and live Zarr multiscale metadata. Mesh and export output directories are separate.

Validation: `node tests/cli-command.mjs` checks shell arguments, shared mesh path, calibration and coordinate units without executing extraction or CT rendering. Browser QA checks desktop/mobile, tabs, action selection, download targets and overflow. Full mesh extraction and flattening are not run as part of this website edit.

## One-command ink-sdk handoff

The default ink-sdk tab now accepts the CLI export directly with one `ink-sdk infer` invocation. It locates the first completed TIFXYZ tile through its `meta.json`, renders the 17-plane depth stack and infers both directions with `ink_9um@scrollprize-seed43-step75000`. It processes that first tile, not every atlas tile. The existing Compare models tab remains available for prepared thick surface volumes.

Requires fetched model weights, VILLA, the external `vc_render_tifxyz` renderer and a local uint8 OME-Zarr copy of Paris 4 CT level 2. Stage that level as array `0` in a standalone OME-Zarr with 9.6 µm scale, origin zero and unchanged XYZ indices; replace the displayed local CT and executable paths. Passing the original native 2.4 µm volume at this path would mismatch exported coordinates. Field extraction and CLI CT sampling stream remotely; ink-sdk 9afd5b0 requires local CT for mesh rendering. No SDK remote-CT capability is claimed.

`tests/sdk-command.mjs` checks the single-command handoff, automatic exported-tile lookup, spaces in paths and scale. `tests/mesh-ink-handoff.py CLI_SOURCE SDK_SOURCE` uses both repositories' actual code to export synthetic float32 TIFXYZ and validate the SDK data inputs, render depth and both-direction profile. Requires numpy, pillow, tifffile, zarr, pydantic; no models. The external renderer check remains an expected missing prerequisite in this local test. Full native rendering and inference are untested.

The comparison tab now reuses `runs/paris4-ink/render` at 9.6 µm with centre 0, preserving the 17-plane window. It considers all profiles and reports incompatible ones rather than relabelling or rescaling their inputs.

## One working scale (19 November 2026)

Geometry and ink use a single CT resolution, 9.6 µm: the `/2` array of the 2.4 µm BM18 scan, addressed with `--voxel-um 9.6 --level 0`, and a local copy of that same array for ink-sdk. The 307.2 µm field grid is a solver setting, not a second CT scale. The site copy no longer refers to "level 2" or "level 0 staging". Checked against ink-sdk `81749a9`: `--tifxyz`, `--ct`, `--voxel-um`, `--renderer` and `--villa` are current; `--normal` defaults to `auto` and is required only for canonical and Hecate profiles. `hecate@2.4um` would allow a 2.4 µm workflow, but needs a local full-resolution copy of the scan.
