> Historical notes. The real-CT field-fitting example below was replaced by the [published Paris 4 extraction and flattening workflow](paris4-example.md).

# Command builder defaults

Reviewed 16 November 2026. The real-CT tab opens first on PHerc1447 with field pitch ×32 = 276.48 µm. Only the real-CT and synthetic-demo tabs remain. Copy commands and the run-folder field are removed; the GitHub guide action remains. Opening the guide records the CLI notebook milestone.

Input was verified against the official public bucket:
`PHerc1447/volumes/20250521151220-8.640um-1.2m-116keV-masked.zarr`.
The level-0 `.zarray` is uint8 with ZYX shape 24297×8343×8343. The 48³ example ROI is centred inside those bounds; it is not a validated papyrus patch. The page says to inspect the CT before selecting a papyrus region.

The CLI source at `ff588ae7ce6e73b6ede36ef96a629adeea88a58e` (1.5.6) still requires `--output` for plan, run and demo. The builder therefore generates a UUID-based run-folder name using Python's standard library and supplies it to the CLI. It does not claim the CLI itself generates the name. No directory entry is requested from the visitor. The full-guide link uses this reviewed source revision.

`node tests/cli-command.mjs` substitutes only the CLI executable with a shell stub, and checks parsed shell arguments, unique generated names, scan/ROI bounds, ×32 defaults, settings changes and the demo command. No research CLI, CT inference or Python solver is executed by that check. Browser verification covered both tabs, keyboard switching, setting updates, removed controls, and mobile wrapping at 320px.

Updated 17 November 2026: defaults are now run / CUDA GPU 0 / field / ×32. The three real-CT facts were removed. The synthetic demo is the short documented `winding-field demo --output runs/demo` command with no UUID setup line; the real-CT command still generates a fresh path. The card row now includes ink-sdk. Both practical sections use the same external `command-workbench.css`, two-column layout, tab styling and GitHub action. Ink-sdk has Compare models and Install & check tabs; Plan/Run toggles only `--dry-run`. The existing battery flags were checked against the current official `src/ink_sdk/cli.py`. The builder does not run installations or inference.
