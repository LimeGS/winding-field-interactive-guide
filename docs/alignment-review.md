# Alignment and spacing review — 16 November 2026

Reviewed the existing Winding Field site without changing its visual identity or content.

## Corrections

- Let narrow hero labels, illustration, motion controls, style controls and caption flow vertically, keeping enlarged labels clear of each other.
- Let the chapter progress row wrap when needed.
- Keep enlarged headings, long labels, timeline buttons, brand text and card content inside their containers.
- Stack very narrow field-metric cards, including at enlarged text sizes.
- Correct the warning symbol's line height and keep principle symbols at their intended width.
- Version the changed stylesheet so returning visitors receive the correction.

## Verification

Normal-size browser measurements: 320, 375, 390, 430, 640, 641, 768, 769, 959, 960, 961, 1024, 1200, 1280, 1344, 1440, 1920 and 2560 CSS pixels. Header, hero, all six chapters, sources and footer retain matching centered gutters. No horizontal page overflow, unintended text clipping or sibling control collisions were detected.

All 18 expandable panels were opened and checked at 320, 768, 1024 and 1440 pixels. Synthetic demo, real-CT and export workbench states were checked; the alternate states were measured at 320, 768 and 1440 pixels. Intentional horizontal scrolling remains in the chapter rail, pipeline tabs, solver chart and data tables.

Text enlargement was tested by temporarily setting the root font to 32px (200% of the compact default), then restoring the production scale. Checks covered narrow mobile, tablet and desktop widths through 1920px. Hero control/caption clearance, page overflow, text clipping and control collisions passed. Temporary QA font and scrolling rules are absent from the published assets.

Visual review included desktop and mobile page composition and the individual illustrations, controls, cards and footer. No application console errors were reported. JavaScript syntax, the existing axial-rotation self-check, and Git whitespace checks also passed.

## Limits

Checks used the available in-app browser and simulated viewports. Physical devices, other browser engines and every possible screen/font combination were not tested. The automated overlap scan checks ordinary flex/grid siblings; absolute-positioned hero controls and captions were checked separately.


## Follow-up: shaded panel gutters

The earlier review missed that shaded section backgrounds began at the text edge. The field, surface and notebook bands now include the shared page gutter inside their backgrounds. This gives text and controls visible space from the band edge while preserving the existing content width and alignment with the unshaded sections. Browser measurements at 320, 390, 768, 1440 and 2560 pixels confirmed symmetric insets (at least 16 CSS pixels), matching text alignment within 0.1 pixels, and no page overflow. The notebook was reviewed visually against the reported issue.
