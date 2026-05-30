# Hero Through About

**What is being tested:** A true "zoom through the landing page" transition. The About content is not revealed by scrolling to a lower section; it sits behind the hero in a pinned depth stack and comes into focus as the hero plane rushes past the camera.

**Key choices**

- Pin one 100vh scene for `240%` scroll distance.
- Scale the hero plane past `3x` and fade it out.
- Keep About behind the hero, starting smaller and blurred, then resolve it to full scale and focus.
- Add faint radial depth rings so the transition reads as moving through space rather than a normal fade.

**Watch for**

- If the hero scale feels too much like a crash zoom, reduce the hero endpoint before changing blur.
- If About appears too early, delay its opacity start; the important moment is the focus pull after the hero begins to leave frame.
