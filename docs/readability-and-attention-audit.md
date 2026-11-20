# Readability and visual-attention audit

**Site:** Winding Field — The Unwrapping Lab  
**Date:** 16 November 2026  
**Scope:** Responsive text, controls, layout, navigation, and the visibility of the next learning action. The English scientific content, lesson order, and distinction between teaching models and production software are preserved.

## Method and evidence boundaries

This work combined source inspection, an **AI-assisted qualitative screenshot review**, and browser verification of the revised interface. The screenshot review considered relative size, contrast, placement, grouping, and the visual prominence of interactive controls. It used the existing desktop, history, and CLI screenshots to identify likely attention priorities and overlooked elements.

**No specialized calibrated saliency model or actual eye-tracking system was run.** No participant gaze was recorded. The attention observations below are design hypotheses, not measured fixation sequences. This audit provides no gaze probabilities, attention scores, or claims of improved engagement, retention, conversion, or learning outcomes.

Browser measurements and interaction results in this document are the results recorded during the implementation's final verification. They are separate from the qualitative attention estimates. CSS viewport sizes were tested; these checks were not performed on physical 32-inch monitors. Screen dimensions, pixel density, operating-system scaling, viewing distance, and individual vision can change perceived size.

## Findings before the revision

### Small fixed typography

The original stylesheet contained **221 fixed-pixel font-size declarations**, including **96 below 12px**. These counts describe CSS declarations, including breakpoint overrides, rather than a count of simultaneously visible elements. Several metadata labels fell to 6–9px. Explanatory text, glossary definitions, and control help also became smaller on mobile, with some paragraphs at 11–14px.

Controls had inconsistent interaction areas: examples included 28px icon buttons, 35px small buttons, and range inputs whose box was only 5px high. Canvas and interface text did not consistently scale together.

### Large-screen content became narrower

The main sections combined a 1560px maximum width with 5.4% padding on each side. That percentage padding was based on the containing viewport width. Consequently, after the width cap was reached, increasing the viewport reduced the usable content width:

| Viewport width | Approximate old section inner width |
| --- | ---: |
| 2560 CSS px | 1284 CSS px |
| 3840 CSS px | 1145 CSS px |

For example, the second value follows from `1560 − (2 × 0.054 × 3840)`. The hero had the same type of issue with its own cap and percentage padding.

### Attention and navigation hypotheses

In the hero screenshot, the large cream-and-lime headline and luminous scroll were the most visually prominent elements. They were likely to draw attention before the smaller start button. The selected **Surface** view used the same solid lime treatment as the main learning action. In the CLI screenshot, the bright selected workflow tab similarly competed with **Preview workflow**.

The smaller drag instruction, scientific figure caption, chapter rail, and notebook progress were easier to overlook. Progress also disappeared at narrower breakpoints. Chapter endings did not clearly identify the next learning step, and the surface experiment's progress condition required a validity-mask interaction that its main action did not explain.

These are qualitative interpretations of the screenshots. They do not establish what any particular visitor looked at or clicked.

## Implemented readability changes

The added `dist/readability.css` layer establishes a shared relative scale. The root size grows from 16px at compact widths to 20px at 2560px and 24px at 3840px; body text uses `1.125rem`. Metadata and code have their own readable relative sizes. Existing colours, serif emphasis, monospace labels, and the scientific-laboratory visual identity remain recognizable.

Containers now use bounded gutters and a scalable `108rem` content cap instead of the old maximum-width/percentage-padding combination. Paragraph measures remain constrained independently from the width available to the experiments. Narrow layouts stack their columns, and technical tables retain their own contained horizontal scrolling rather than widening the page.

Buttons, range input boxes, toggles, and other primary controls use larger relative interaction areas. A thin slider track sits within a taller input box. Canvas redraws account for available dimensions, root-font size, and display pixel ratio, keeping diagram labels in step with surrounding UI.

The revision also addresses narrow-screen details: wrapped hero view labels, single-column metric rows where needed, readable glossary/source layouts, a wrapping header for enlarged text, and consistent notebook paragraph sizing. Labels placed over photographs now have a contrasting backing so their legibility depends less on the image beneath them.

## Measured browser results

All measurements below are **CSS pixels**, at the normal root-text setting unless stated otherwise. “Metadata” and “code” refer to the representative audited text roles, not every superscript or glyph. The main content values are reported where the large-screen cap applies.

| Viewport width | Root font | Body font | Metadata font | Code font | Main content width |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 320 | 16 | 18 | 14 | 15 | — |
| 390 | 16 | 18 | 14 | 15 | — |
| 768 | 16 | 18 | 14 | 15 | — |
| 960 | 16 | 18 | 14 | 15 | — |
| 1280 | 16 | 18 | 14 | 15 | — |
| 1440 | 16.5 | 18.5625 | 14.4375 | 15.4688 | — |
| 1920 | 18 | 20.25 | 15.75 | 16.875 | — |
| 2560 | 20 | 22.5 | 17.5 | 18.75 | 2160 |
| 3840 | 24 | 27 | 21 | 22.5 | 2592 |

At all nine tested widths, the measured document/page width equalled the client width: the normal page did not introduce horizontal overflow. The audited visible-text states contained no text below 14 CSS px. Primary buttons and range input boxes were at least 48 CSS px high at the compact baseline; larger root sizes scale those dimensions upward. These measurements concern interaction boxes, not the visual thickness of a slider track.

### Enlarged-text check

A separate check doubled the root text size at a 1280px viewport. Following the header/layout correction, the measured values were:

| Measurement | Result |
| --- | ---: |
| Root font | 32 CSS px |
| Document/page width | 1265 CSS px |
| Client width | 1265 CSS px |

The enlarged-text check passed the audited layout/reflow check without page-level horizontal overflow. This was a 200% root-text test, not a claim that every browser zoom mode, operating-system text setting, or assistive-technology combination was exercised. Width equality alone also does not establish that every possible state satisfies every accessibility requirement.

## Implemented attention and navigation changes

The visual hierarchy now gives view selection a quieter treatment and uses stronger filled actions for the next meaningful step:

| Area | Implemented change | Intended purpose |
| --- | --- | --- |
| Hero | Primary **Start with the story**; secondary **Jump to the experiments** | Make both destinations explicit while retaining a clear starting route. |
| Hero and CLI tabs | Subdued selected-state fill, lime text, and an outlined emphasis | Distinguish a selected view from the main action. |
| Chapter endings | A question, a brief explanation, and a next-chapter link | Make the learning sequence discoverable without relying on continued scrolling. |
| Four experiments | A concise “Try this” mission immediately before the interaction | Explain what to manipulate and what to observe. |
| Progress | Visible, clickable **Field notes · 0/4 explored**, including narrow screens | Keep the four experiment notes accessible without confusing them with the six chapters. |
| Notebook | Links from each discovery back to its experiment | Support review and returning to an unfinished interaction. |
| Chapter rail | Reveal the active chapter within the horizontal rail, including after resizing | Keep the current location visible without moving the document or keyboard focus. |
| Surface experiment | **Unwrap it** is the primary button; a cue asks the visitor to show the validity mask after unwrapping | Expose the second action needed to inspect missing-data semantics and collect that field note. |

The four missions ask visitors to compare a coherent field with drift, test the solver with a wrong relationship, unwrap a surface and inspect its validity mask, and preview a documented command workflow. Completion does not automatically navigate away. The progress wording describes exploration, not proven understanding or mastery.

The new sequence remains: **story → winding field → solver → surface → code → field notes**. Source links, scientific qualifications, and the distinction between synthetic demonstrations and archaeological evidence remain available.

## Functional verification after the changes

The presentation and navigation changes were checked against the existing interactive behaviour:

- The clean toy solver and the solver with an intentionally wrong relationship both converged. The wrong-relationship run reached **46 iterations** with a displayed relative linear-system residual of approximately **8.96 × 10⁻⁸**. This preserves the lesson that solving the equations does not establish physical correctness.
- The surface illustration reached **100% unwrapped**, and the follow-up cue directed attention to the validity mask. The mask interaction remained functional.
- All five CLI field-grid pitch presets retained the expected values for the documented 48-voxel ROI at 8.64 µm input pitch:

| Preset | Requested field pitch | Field nodes per axis |
| --- | ---: | ---: |
| Native / ×1 | 8.64 µm | 48 |
| ×4 | 34.56 µm | 12 |
| ×8 | 69.12 µm | 6 |
| ×16 | 138.24 µm | 3 |
| ×32 | 276.48 µm | 2 |

These are checks of the educational browser interface. The command builder still previews commands without executing them, and the browser solver remains a small synthetic teaching model rather than the Python production solver.

## Reference framework and limits

The following references informed the review; they are not evidence of formal certification:

1. **[W3C: Understanding Reflow, SC 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).** The guidance explains reflow at a width equivalent to 320 CSS pixels and recognizes content whose meaning requires a two-dimensional layout. It informed the narrow-viewport checks and contained treatment of technical tables.
2. **[W3C: Understanding Resize Text, SC 1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html).** The guidance addresses resizing text up to 200% without losing content or functionality. It informed the additional enlarged-root-text check.
3. **[W3C: Understanding Target Size (Enhanced), SC 2.5.5](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html).** This Level AAA criterion describes a 44-by-44 CSS-pixel target, with specified exceptions. It informed larger control areas; the audit does not claim that every target or the complete site satisfies Level AAA.
4. **[DeepGaze III: Modeling free-viewing human scanpaths with deep learning](https://pmc.ncbi.nlm.nih.gov/articles/PMC9055565/), Kümmerer, Bethge and Wallis, 2022.** This research models fixation sequences using image information and previous fixations. It is cited to distinguish a dedicated predictive model from this audit's qualitative inspection. **DeepGaze III was not executed or used to score this website.** Its results are not transferred to this interface.

This is a focused readability and interaction review, **not a formal WCAG conformance audit, physical-monitor test, user study, or measured attention experiment**. The browser checks support the stated layout and behaviour findings. Whether the changes improve engagement or learning would require suitable user evidence; no such improvement is quantified here.
