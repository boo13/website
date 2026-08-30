# Objective UI/UX fixes

Status: implemented and verified locally

Scope: shared video player on the four video project pages, its scaffold, and the homepage footer. Keep the existing typography, palette, content, and motion direction. Acceptance depends on observable behavior, not aesthetic preference.

## Reproduced defects and implementation

| Defect | Before evidence | Fix | Acceptance |
| --- | --- | --- | --- |
| Sound control overlaps seeking | At 375 × 812 on Wyatt Earp, sound occupies y=739–756 while the timeline occupies y=748–750. | Put sound alongside Credits in the normal layout flow; wrap the control row on phones. | No intersections between title, buttons, seeking, or timestamps at 320, 375, 768, 1024, and 1440px widths, including landscape. |
| Total duration stays zero | Browser reports duration=12.914 while the total label remains `00:00`; metadata can arrive before initialization attaches its listener. | Initialize the timeline and labels from the current video state; also update on metadata and duration changes. | A loaded 12.914-second clip displays `00:12`, including when initialized after metadata is already loaded. Invalid/unknown duration keeps seeking disabled. |
| Seeking requires a pointer | Timeline is a div with tabIndex=-1, no slider semantics, and only a click listener. | Use a labeled native range input with a visible keyboard focus state, synchronized elapsed time, and a minimum 24px interaction height. | Tab reaches seeking; arrows/Home/End and pointer dragging update playback within bounds. |
| Reduced-motion footer cannot be clicked | Footer becomes static but retains `pointer-events: none`; hit-testing the Home link reaches BODY. | Enable pointer events for the static reduced-motion footer. | Footer links receive actual pointer clicks with reduced motion enabled. |
| Keyboard focus enters a concealed footer | Tab from the newsletter/contact controls reaches footer Home while it is covered by `.container` and the footer is not interactive. | Reveal the footer immediately when keyboard focus enters it, using the existing ScrollSmoother/ScrollTrigger positions. | Forward and reverse Tab keep focused footer links visible and usable; mouse-driven reveal still works. |

The player control change also preserves the reduced-motion preference when scrolling to Credits or back to the video. Update DESIGN.md alongside the new native timeline and keyboard reveal behavior. Its existing smooth-scroll rule needs this explicit reduced-motion exception.

## Verification

- [x] Implement the shared player and update all four pages plus `scripts/scaffold-project.mjs`.
- [x] Implement both homepage footer fixes.
- [x] Verify actual keyboard, pointer, metadata-race, and reduced-motion behavior using `playwright-cli`.
- [x] Inspect rendered controls at narrow, tablet, desktop, and landscape sizes after fonts and animation settle.
- [x] Run `npm run lint` and `npm run build`; review the final diff.

## Results

- Chromium: Wyatt Earp controls had no intersections, clipping, or horizontal page overflow at 320×568, 375×812, 768×1024, 1024×768, 1440×900, and 812×375. All four players also passed the 320px and landscape checks with the viewport returned to the hero after resizing. Mobile and desktop screenshots were inspected and temporary screenshots removed.
- Native seeking: Home + ArrowRight moved to 0.1s; End reached 12.9s of a 12.914s clip; a middle click moved to 6.5s. Dragging to 75% of Pope moved playback to 22.6s of 30.038s. The range has a 24px interaction height and synchronized accessible value text.
- Metadata race: delayed the project entry module until the real video already reported 12.914s; the initialized label correctly displayed `00:12`. All four project totals populated (`00:12`, `01:42`, `00:30`, `01:52`). Removing the media source disabled seeking and reset the total to `00:00`.
- Normal motion: Tab from newsletter/contact controls revealed footer Home; hit-testing confirmed the focused link was uncovered. Tab and Shift+Tab retained normal footer order.
- Reduced motion: an actual click on footer Home navigated to `#hero` at scrollY=0. Project Credits and back-to-video buttons scrolled immediately to the respective sections.
- `npm run lint`, `npm run build`, and `git diff --check` passed. Existing development-only telemetry and favicon 404s were observed; no application exceptions were encountered in these checks.
- Browser verification was local Chromium; Safari, Firefox, and production deployment were not part of this pass.

Contact fields were also inspected for labels, input sizing, and narrow-screen clipping. The homepage gallery remained partially visible under keyboard focus; that finding alone does not justify changing its layout in this pass. This is a bounded audit, not a claim of complete accessibility conformance.

Standards references: [W3C keyboard operation](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html), [W3C visible focus](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html), and [native range input behavior](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/range).
