# Scientific audit — The Unwrapping Lab

Reviewed: **15 November 2026**

## Result and scope

The educational page has been revised after an audit of its historical narrative, visible scientific claims, glossary, illustrations, mathematical explanations, browser experiments and CLI command builder. The review compared historical and scientific claims with primary institutional and research sources, and implementation claims with the two repository snapshots below. Separate reviews covered history, the numerical core and the CLI.

The review found and corrected misleading language and several distinctions that matter scientifically. It did not establish that any reconstruction produced by the upstream repositories is archaeologically correct. The browser uses synthetic teaching examples, and this audit did not execute a full production CT workflow or validate a real ancient manuscript.

### Reproducible source snapshots

| Project | Revision reviewed | Principal evidence |
| --- | --- | --- |
| [winding-field](https://github.com/LimeGS/winding-field/tree/96631f3cf8aad385054b58b48c91a05a6a053eb1) | `96631f3cf8aad385054b58b48c91a05a6a053eb1` | README, `src/field_solver.py`, `src/paris_data.py`, `src/coherence_pipeline.py`, winding evaluation documentation |
| [winding-field-cli](https://github.com/LimeGS/winding-field-cli/tree/b914f566855a3264925b9a0bcc65666fdb3365e4) | `b914f566855a3264925b9a0bcc65666fdb3365e4` | CLI parser, workflow and renderer code; README; `STREAMING.md`, `FLATTENING.md`, `FORMATS.md`; synthetic demo |

These revisions matched the repositories' remote HEADs when reviewed. Future upstream changes can alter defaults, options and output contracts; the page intentionally links to these pinned revisions.

## 1. Eruption, papyri and historical context

| Topic | Correction or conclusion | Evidence |
| --- | --- | --- |
| Hero headline | Replaced “lost to fire” with **“buried in ash.”** The former suggested an ordinary fire as the explanation for the scrolls' condition. | [USGS ash definition](https://pubs.usgs.gov/fs/fs027-00/); [Pensa et al., 2023](https://www.nature.com/articles/s41598-023-32623-3) |
| Ash and carbonization | The expanded explanation separates hot pyroclastic currents, carbonization of papyrus, and burial in volcanic deposits. Volcanic ash is fragmented rock, minerals and volcanic glass. The surviving papyri did not become the ash that buried them. | USGS; Pensa et al.; [pulsed thermographic material study, 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12508051/) |
| Survival of writing | Removed the implication that the eruption made all scrolls unreadable. Carbonized rolls are brittle and damaged; surviving material can preserve writing. The text discusses the risk of physically opening an intact roll without claiming that no papyri have ever been opened or read. | [Getty: Villa dei Papiri](https://www.getty.edu/art/exhibitions/villa_papiri/inner.html); material study |
| Historical dates | Retained 79 CE. Relabeled 1752–54 as **“Scrolls recovered”** so it cannot be mistaken for the rediscovery of Herculaneum or the villa. No exact eruption day or single universal exposure temperature is asserted. | Getty; Pensa et al. |
| Historical images | The ruins photograph depicts Herculaneum, not a claimed photograph of the ancient library. The papyrus photograph identifies the source specimens and the source's image enhancement. Additional specimen colour grading and overlay were removed. | Image sources and credits linked in the page |

“Lost to ashes” was not adopted: it could suggest that the papyrus was consumed into combustion residue. “Buried in ash” is a concise headline; the body supplies the more precise explanation involving pyroclastic currents and volcanic deposits. This wording does not make the broader claim that no fire or burning occurred anywhere during the disaster.

### Vesuvius Challenge context

The history section includes a brief introduction to the Vesuvius Challenge as an open science effort that combines CT, machine learning and geometry to read scrolls without physically unrolling them. Its shared data, open tools and prizes are described on the [official homepage](https://scrollprize.org/) and [FAQ](https://scrollprize.org/faq), checked on 15 November 2026. The wording makes no claim of official endorsement of this educational page or of the winding-field repositories.

## 2. CT, geometry, ink and reading

| Topic | Corrected explanation | Evidence |
| --- | --- | --- |
| CT reconstruction | CT reconstructs an image from X-ray measurements taken at many angles. A voxel stores a reconstructed image value; it is not a direct point measurement of a papyrus layer. | [NIBIB CT explanation](https://www.nibib.nih.gov/science-education/science-topics/computed-tomography-ct); [Vesuvius Challenge data](https://scrollprize.org/data) |
| Geometry versus text | Finding a candidate surface, flattening it, detecting ink and interpreting writing are separate tasks. These repositories fit geometry and sample CT; they do not perform ink detection or translate Greek. | Both repository snapshots; [official ink detection tutorial](https://scrollprize.org/tutorial5) |
| Ink contrast | Retained the qualified wording that carbon-based ink and carbonized papyrus **can** produce very similar X-ray signals. The page does not claim that all inks are invisible or that ink and substrate have identical composition or density. | Official ink detection tutorial; papyrus material study |
| Interpretation | A plausible word is insufficient on its own: readings must be supported by recovered physical evidence and assessed using letter forms, language and context. | Official Vesuvius Challenge workflow; explicit scientific reasoning in the page |

## 3. Winding fields and numerical methods

| Topic | Corrected explanation or verified behavior | Evidence |
| --- | --- | --- |
| Meaning of W | W is a calibrated continuous local coordinate, nearly constant along a surface and changing across layers. It is not a polar angle, discrete page number or certified physical sheet identifier. Adjacent local layers may be different turns of the same rolled strip. | Core README; `paris_data.py`; evaluation documentation |
| Sign and scale | Crossing an adjacent layer changes W by approximately **±1**, depending on the chosen orientation and calibration. The analytic toy explicitly chooses increasing layer index as its positive direction. The solver toy explicitly uses `sheet_step = 1`, so its raw φ equals W. | Core field and calibration code; browser toy definitions |
| Absolute offset | Replaced the unconditional claim that an exact anchor always fixes the zero. Fixed values or effective reference penalties can set the scalar offset; without either reference, the implementation pins a node. | `src/field_solver.py` |
| Objective and PCG | The displayed objective describes weighted target-gradient differences, same-fibre constraints and an optional reference. The current B2 implementation uses continuous interpolation for fibre pairs. The core uses a matrix-free preconditioned conjugate-gradient approach. | `field_solver.py`; `coherence_pipeline.py` |
| Validation | Convergence demonstrates numerical consistency with the specified system, not physical truth. Fibre agreement on data used in fitting is a consistency check. Independent or reserved annotations, coverage, separation, original CT and other diagnostics are needed to assess reconstruction. | Core README; winding benchmark evaluation contract |
| Collapse | The analytic all-zero candidate can have zero along-fibre drift while destroying layer separation. The experiment correctly illustrates why a single favorable metric is insufficient. | Direct inspection of analytic toy equations |
| Isosurfaces | A constant-value set is a candidate surface. It can have disconnected components or pass between papyrus layers; at critical points it need not be a regular surface. Extracting a mesh does not establish sheet identity. | Scalar-field mathematics; core's stated scope and validation limits |
| Topology | A rolled sheet can require cuts or linked local charts. The local teaching field does not demonstrate a globally valid coordinate for a complete scroll. | Core README; CLI chart and flattening workflows |

The 72-node browser solver remains an actual JavaScript computation of a weighted graph problem. It checks the true relative linear-system residual before reporting convergence, and does not treat reaching the iteration limit as success. The injected bad relationship deliberately produces a geometrically wrong but numerically solvable system. The numerical implementation was not changed by this audit's copy and illustration corrections; its prior independent least-squares checks remain applicable.

## 4. Illustrations and flattening

| Element | Revision or qualification |
| --- | --- |
| Hero “X-ray view” | Renamed **“Wireframe.”** This is drawn geometry, not simulated X-ray transmission or reconstructed CT. |
| Hero colour mode | Renamed **“Illustrative colours.”** The colours are neither a fitted W field nor verified sheet labels. |
| Today timeline drawing | Replaced independent closed rings with one continuous schematic spiral. The caption explicitly identifies it as a drawing, not archaeological CT. |
| Analytic field chart | Fixed synthetic geometry with selectable candidate fields. Its controls select known synthetic layers, although the analytic field exists continuously between them. All displayed samples are supported by construction. |
| Surface animation | Demonstrates point correspondence between a curved surface and an image. Distances and areas can change. The animation implements neither SLIM nor LSCM and does not claim to compute a distortion-minimizing parameterization. |
| Validity mask | The two-state toy contrasts an unmapped location with a valid dark sample. Real products can encode more states, including mapped geometry with unavailable CT, ambiguity and other rejection reasons. |

A synthetic drawing is appropriate for explaining a concept, provided its provenance and limits are visible. The page now labels these distinctions beside the relevant controls and demonstrations.

## 5. CLI behavior and commands

| Topic | Correction or verified contract | Primary evidence in CLI snapshot |
| --- | --- | --- |
| Synthetic demo | Uses generated curved-layer data and a classical predictor; it does not download a real ancient scroll or decode writing. It produces a local inspection gallery. | `demo.py`; parser; README |
| Small real CT example | The PHerc0175A example specifies a **48 × 48 × 48 voxel output ROI at 8.64 µm voxel pitch**. Prediction reads additional surrounding context. Upper ROI bounds are exclusive and ordering is Z0 Z1 Y0 Y1 X0 X1. | README; parser; preparation/workflow code |
| Planning | Renamed the option **“Plan storage & grids.”** Planning reports grids, storage estimates and disk headroom without running inference or creating the run. It is not a guarantee of runtime RAM or VRAM consumption. | `cli.py`; `workflow.py` |
| Streaming and cache | Streaming fetches CT chunks on demand. `--cache-gib` bounds retained compressed CT payloads; it is not a total process-memory or output-size cap. | `docs/STREAMING.md`; cache implementation |
| Grid pitch | A coarser field grid does not reduce the native model input resolution. | Workflow and preparation code |
| Fresh and saved runs | `run` needs a fresh output directory. Existing work can be continued with the appropriate `field` or `resume` route. A deliberate stop after the field can legitimately report PAUSED. | CLI parser; workflow state handling |
| Flattening defaults | New native runs use local charts refined with SLIM. The specific `export-sheets --run` route uses the original global LSCM recipe. Continuing a native run preserves its saved method. | Parser; `docs/FLATTENING.md`; renderer/export code |
| Resampling | The demonstrated renderer samples CT at mapped surface XYZ points. The page no longer implies that this route automatically samples a depth stack around every surface. | `native_render.py`; `original_pipeline.py` |
| Coordinates and levels | `--levels` uses raw φ. Normalized W equals φ divided by `sheet_step`. The documented −31 is an example, not a universal layer index. The export defaults to physical XYZ in micrometres. | Parser; `docs/FORMATS.md`; export code |
| Output types | Meshes describe geometry. Flattened CT images contain resampled scan data. Validity masks and XYZ maps describe support and correspondence. These products do not themselves establish ink or a verified reading. | Format contracts; export/render code |
| Command preview | The browser generates real documented command syntax, but the terminal walkthrough is explicitly illustrative and executes no commands. | Browser implementation; upstream parser |

Where an isolated upstream sentence conflicted with the CLI parser and dedicated flattening guide, the page follows the executable defaults and the dedicated guide. Specifically, a stale flattening-default sentence in the native section of `FORMATS.md` was not used to override the current SLIM default.

## Field-grid preset update — 16 November 2026

The command builder now offers Native, ×4, ×8, ×16 and ×32 relative to the fixed example's 8.64 µm CT voxel pitch. It defaults to ×8. These are interface presets translated into explicit numeric `--field-spacing-um` arguments, not named CLI values or claims of optimal reconstruction quality.

| Preset | Requested pitch (µm) | Field nodes for the 48³ example ROI |
| --- | ---: | --- |
| Native | 8.64 | 48 × 48 × 48 |
| ×4 | 34.56 | 12 × 12 × 12 |
| ×8 | 69.12 | 6 × 6 × 6 |
| ×16 | 138.24 | 3 × 3 × 3 |
| ×32 | 276.48 | 2 × 2 × 2 |

The pitch-to-grid relationship was checked against [`field_geometry` in the pinned CLI](https://github.com/LimeGS/winding-field-cli/blob/b914f566855a3264925b9a0bcc65666fdb3365e4/src/winding_field/config.py) and the [coordinate contract](https://github.com/LimeGS/winding-field-cli/blob/b914f566855a3264925b9a0bcc65666fdb3365e4/docs/FORMATS.md). For ordinary preparation at level 0 and stride 1, the per-axis count is `floor((48 - 1) / factor) + 1`. All five choices meet the two-node minimum. Coarser grids lose spatial detail, which is stated beside the control with a live node-count summary. The generated command and illustrative planning transcript use the same selected pitch.

These presets change the solve grid only; they do not downsample CT/model inputs. Ordinary preparation keeps exact spacing and the final node within the observation extent, rather than forcing it onto the far ROI endpoint. In the ×16 and ×32 cases, the last field node falls at original sample index 32, while the last observation is at index 47. The node counts above are specific to this fixed example and are not a general rule for other ROIs or bounded preparation. All five presets were selected in the browser and their generated CLI spacing and node-count summaries checked. The planning preview and desktop/mobile selector layouts were also reviewed.

## Verification record

- Source-level review of all narrative sections, glossary entries, dynamic feedback, command templates, synthetic geometry, solver objective and output descriptions.
- Separate historical, numerical-core and CLI reviews, followed by a focused review of the applied core and CLI corrections.
- JavaScript syntax checks and static resource/anchor checks.
- Browser review of the revised headline, illustration modes, historical timeline, ash explanation, field feedback and command-builder text, including the narrow-screen layout.
- No production model inference, archaeological reconstruction, ink recovery or physical validation was performed as part of this audit.

The scope is scientific accuracy of this educational explanation at the pinned revisions. It is not certification of the upstream research or a guarantee that every reconstruction from those tools is valid.
