# Numbered solver visualization

**Date:** 16 November 2026

Every one of the 72 synthetic samples now has a live numeric badge above its dot. Canvas labels and the optional accessible table use the same current `solverState.phi[i]` through a shared two-decimal formatter. This toy already uses `sheet_step = 1`, so the reader-facing W equals the stored phi. Formatting suppresses a rounded negative zero without modifying the numerical value.

The fixed-zero sample retains its white ring. Both endpoints of the deliberately wrong relationship have coral rings and matching labels; the table highlights the same cells. The graph keeps twelve samples in each geometric row. A minimum width of 50rem preserves legibility on phones, with contained horizontal scrolling, an overflow hint, and explicit Left/Right/Home/End keyboard navigation. Wider layouts give the graph two thirds of the experiment width; compact layouts stack the controls below it.

## Verification

- `makeSystem`, `pcgStep` and `solverMetrics` were checked byte for byte against the previous committed version and are unchanged. Run, step, reset and convergence logic also remain unchanged.
- A single step updated all sample values. The default clean run completed at 47 iterations with a displayed relative system residual of 5.94e-8.
- Enabling the wrong relationship reset all 72 displayed values to 0.00. The contradictory run converged at 46 iterations with a displayed residual of 8.96e-8; its highlighted endpoints displayed 1.67 and 2.97. These are rounded values from a soft-constraint fit, not an assertion that their difference must equal the target exactly.
- The 390px browser frame allowed keyboard scrolling to 64px, then to its 459px right limit with End, and back to zero with Home. The value table opened without page overflow.
- Browser checks at 320, 390, 1280, 1440 and 2560 CSS pixels showed no horizontal page overflow. Only the graph and optional table scroll internally when needed. The graph label size follows the root scale: 16px on compact viewports and 20px at 2560.
- No application-origin console errors were observed in the inspected log. The temporary responsive fixture was removed before publication.

[Recorded values and measurements](solver-numbers-verification.json) preserve the browser evidence. Screenshots show the [clean run](solver-numbered-clean.jpg), [contradictory run](solver-numbered-bad.jpg), [mobile review](solver-numbered-mobile.jpg) and [wide review](solver-numbered-wide.jpg). Mobile and wide screenshots include the temporary review surface, which is not shipped.
