# Hero Aperture

**What is being tested:** A transition where the landing video remains present at the edges of frame while the About section resolves through a center opening.

**Key choices**

- Pin one 100vh scene for `260%` scroll distance.
- Mask the video layer with a growing radial aperture instead of fading it away.
- Leave the video blurred and moving on the perimeter at the end state.
- Put a radial glow behind About so the center reads separately from the video edge texture.

**Watch for**

- The aperture radius is the main control. If text feels cramped, enlarge the final hole before reducing edge-video opacity.
- If the video edge competes with the headline, increase edge blur rather than darkening the whole frame.
