# Ink lab

Added 16 November 2026. The new interactive lesson follows the label → CT → neural prediction → error → weight update → unseen-fragment inference flow described in the [Vesuvius Challenge tutorial](https://scrollprize.org/tutorial5).

The browser uses generated papyrus-like fragments, invented strokes and three synthetic depth slices. It does not download archaeological CT, run ink-sdk or claim an ancient reading. Labels are a three-state mask: ink, background and unknown. Only labelled pixels are sampled for training. Both classes are required. The brush supports continuous pointer strokes, touch pointer events, keyboard arrows/Space, erasing, brush sizing and optional sparse example labels.

`ink-model.js` contains a small 4 → 8 tanh → 1 sigmoid classifier with Adam updates. Four features are derived from local synthetic CT slice values and their differences; coordinates and reference glyph images are not model inputs. The user mask supplies the labels. The generated stroke field is used only to construct the synthetic CT and display the reference, not as a target passed to the trainer. Fragment B uses a different seed and no labels from B enter training. Its reference is locked until the first scan completes. Deliberately wrong labels teach the model the wrong association.

Training is shown as 12 cycles of four phases, about 22 seconds at 1×. Each update phase runs ten rounds, with four balanced 128-sample batches per round. The UI supports pause, single step and 0.5×/1×/2× playback. Inference takes about ten seconds, freezes the trained weights, and supports pause, replay, pre-training comparison and reference comparison. Training loss reports agreement with the user's labels, not archaeological accuracy. Off-screen and hidden-document updates are suspended; reduced-motion users start paused and do not see moving connection particles.

The ink lab adds a fifth notebook milestone. Existing progress keys are retained. The overall chapter numbering remains seven; the geometry command workbench becomes experiment 05.

## Validation

`node tests/ink-model.mjs` verifies that sparse labels reduce loss, that predictions separate synthetic ink/background on a separately generated fragment, that inference leaves weights unchanged, that reversed labels change the learned association, and that the continuous brush, eraser and fragment boundaries behave correctly. These are engineering checks on an intentionally learnable synthetic problem, not scientific model evaluation.

Browser checks cover pointer clicks and continuous dragging, keyboard painting, class gating, clear/example masks, stepping, pausing, automatic completion, scan pausing/resuming, result comparisons and editing after completion. New layouts were checked around 320, 390, 768, 1024, 1440 and 2560 CSS pixels. Physical touch devices, assistive-technology operation and real research-model inference are outside this check.

## Compact screen workspace

The ink and field sections now use viewport-height workspaces below the measured chapter navigation. Desktop layouts pair the visual area with a right-hand console. Narrow screens show one training/result visual at a time, selected by explicit tabs; short-screen layouts omit secondary prose. Supporting scientific explanation opens in a native, dismissible dialog. The Field retains its approved award sentence, chart, three modes, probes and feedback, arranged to follow the supplied reference. Chapter navigation and existing notebook keys are preserved.

Synthetic reference and CT artwork is generated at three times the model's spatial resolution (648×432), displayed on higher-resolution canvases. Reference geometry is tested against the model coordinate system. CT textures are cached between animation frames; the learning model and probability-map resolution remain unchanged. Mask canvas dimensions preserve its aspect ratio and pointer-to-label alignment.

Compact-layout browser checks covered 1440×900, 1366×768, 1024×600, 768×1024, 390×844, 320×568 and 844×390 viewports (browser rounding can vary by a pixel). Verified painting/clear, CT/reference switching, complete learning/inference, field modes, dialog return navigation and control visibility. The optional example mask is omitted from the shortest portrait toolbar. Physical mobile devices were not tested.

## Visible learning loop

Training now has three equal visual columns (CT, network, comparison) and a bottom control/metric strip. A four-step indicator follows Sample → Predict → Compare → Adjust weights. Both comparison images use identical dimensions and coordinates. Orange rectangles track the sampled location in CT, known labels and the current fragment-A prediction; a visible legend distinguishes ink, background and unknown labels. The scalar score is explicitly labelled as ink probability at one selected point, not model accuracy. Mobile tabs follow each active training phase, including manual stepping. Fragment B is explicitly labelled as new data without training labels.
