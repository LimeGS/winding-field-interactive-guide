# Concise foundations review

**Date:** 16 November 2026

## Purpose and changes

Explain the complete idea to a technical reader who is new to papyrus, Herculaneum and these repositories, without turning the main story into implementation documentation.

The new “The scroll has a grain” bridge contains about 170 words of core explanatory copy, with a schematic and three selectable clues. It introduces plant strips and fibre texture, Lasagna-based surface predictions, Qual V2 followed by a separate tracer, and the coordinate fitted by winding-field. Main tool roles remain visible; optional expanders explain the broader framework and prediction products. The comparison to wood grain is an analogy for directional structure, not a claim that papyrus is wood or woven cloth.

The surrounding story now defines CT at first use. The solver introduction uses an imperfect-clues challenge. The surface chapter uses a flat-map analogy and moves SLIM/LSCM route details into a closed expander. The diagram heading uses “2D map” instead of unexplained UV coordinates. Glossary entries cover fibres/normals, Lasagna/Qual V2, winding density, and spline/AFV. The command builder retains all commands and field-grid presets; only its tracing explanation changed.

## Scientific review

The copy and diagram were reviewed against the same pinned source snapshots used by the site:

- [CLI Lasagna integration](https://github.com/LimeGS/winding-field-cli/blob/b914f566855a3264925b9a0bcc65666fdb3365e4/docs/LASAGNA.md): the CLI consumes surface prediction products. The broader Lasagna framework is not described as merely a neural network.
- [CLI format contracts](https://github.com/LimeGS/winding-field-cli/blob/b914f566855a3264925b9a0bcc65666fdb3365e4/docs/FORMATS.md): fibre predictions, traced spline geometry, and coordinate metadata remain distinct.
- [CLI flattening](https://github.com/LimeGS/winding-field-cli/blob/b914f566855a3264925b9a0bcc65666fdb3365e4/docs/FLATTENING.md): native local SLIM charts and the specific original-global-LSCM export route remain distinct.
- [Core source](https://github.com/LimeGS/winding-field/tree/96631f3cf8aad385054b58b48c91a05a6a053eb1): geometric observations constrain a local scalar coordinate; a candidate surface still needs validation.
- [Vesuvius Challenge FAQ](https://scrollprize.org/faq): physical papyrus construction and crossed plant structure.
- [Official Villa project](https://github.com/ScrollPrize/villa/blob/main/README.md): broader Lasagna framework context.

The schematic uses exact concentric circular arcs: highlighted fibre paths follow their tangents, normal arrows follow radial perpendiculars, and the spacing dimension measures separation radially. It is visibly labelled illustrative, not CT data. Winding density refers to geometric coordinate change, not mass density or CT brightness. Qual V2 predictions and the separate tracing stage are kept distinct; neither fibres nor geometry are presented as ink detection. Points with equal field values produce candidate geometry rather than a certified physical sheet.

The review found no material scientific error in these additions. It replaced an undefined “level sets” phrase with a plain-language description. This is a source and schematic review, not archaeological validation or execution of the Python model pipeline.

## Focused browser verification

The temporary responsive harness was removed before publication. Final measurements are in [foundations-metrics.json](foundations-metrics.json).

| CSS viewport width | Minimum supporting text in new section | Clue-button height | Page horizontal overflow |
| --- | ---: | ---: | --- |
| 320 | 14px | 48px | None |
| 390 | 14px | 48px | None |
| 1348 | 14.19px | 48.63px | None |
| 2560 | 17.5px | 60px | None |

Core explanatory text is 1rem: 16px on compact viewports and 20px at 2560. The new controls fit in one row at 320 and 390, while much narrower containers can stack them. The wide schematic has a width cap to avoid needless vertical growth. Browser dimensions are CSS viewports, not tests on physical monitors.

All three clue modes were exercised. The active button state, visible caption, and diagram description update together; keyboard activation was verified. Both optional model explanations opened and closed. There were no application-origin console errors in the inspected log. Existing numerical code and command generation were not changed, so their previous verification was not repeated.

Screenshots: [laptop preview](foundations-laptop.jpg), [mobile review](foundations-mobile.jpg), and [wide review](foundations-wide.jpg). The mobile/wide screenshots include the temporary review surface; it is not part of the delivered site.
