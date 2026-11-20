# Local ink education — 17 November 2026

The educational part of the ink chapter is visible before the compact experiment. Previously compact initialization replaced the introduction and moved explanation into a dialog.

## What changed

- A physical-signal introduction: weak carbon-on-carbon contrast and the role of human review.
- Four keyboard- and pointer-accessible steps: sample a surface volume, distinguish labels from the supervision mask, switch training/inference, and inspect a score map with a display-only cutoff.
- Short training/inference pseudocode, sources of labels, one real architecture example, model-transfer limits, and validation checks.
- The existing tiny trainable classifier is retained in its own nested screen-sized workspace. The chapter link opens the educational introduction; the educational CTA opens the experiment below the sticky navigation.

## Sources and scope

Reviewed against these primary sources on 17 November 2026:

- https://scrollprize.org/tutorial5 — surface volumes, ink/background labels, supervision masks, training, inference and overlapping patches.
- https://huggingface.co/scrollprize/ink_9um — one shared model family: local 3D stem, 2D U-Net, 17-slice training windows, scale/depth requirements and label smoothing.
- https://arxiv.org/abs/2606.29085 — physical CT evidence and human/papyrological review.

The new canvas is explicitly a synthetic schematic. Its 17-position depth scrub interpolates three invented slices; it is not a real CT stack. The schematic scores are constructed from synthetic reference marks plus a deliberate false positive. They do not come from a research model. The existing experiment separately trains its small JavaScript classifier on user labels and invented measurements. Neither feature reconstructs archaeological CT or establishes a reading.

The pseudocode illustrates flow, not a complete production training script. The architecture example is one model family, not a universal description of all ink detectors. A display cutoff does not retrain the network or supply independent evidence. Raw scores are not presented as calibrated certainty.

## Verification

- Syntax checks of the new primer, compact initialization and main module.
- `node tests/ink-primer.mjs`: changing depth, trusted positive/negative labels, ignored unlabelled ink, display cutoff and unchanged input.
- `node tests/ink-model.mjs`: actual training/generalization and brush/reference alignment.
- Browser interaction at 1440×900, 390×843 and 320×567 CSS pixels: educational tabs, depth control, supervision mask, operation switch, cutoff and keyboard navigation; no horizontal page overflow or clipped text detected.
- Existing desktop experiment: example labels, training completion and inference scan on the new fragment. CTA at 320×567 places the compact experiment below the navigation, with its bottom at the viewport edge (subpixel rounding).
- No browser console warnings or errors observed during focused checks.

All changes are local. No Sites publication or production change is part of this revision.
