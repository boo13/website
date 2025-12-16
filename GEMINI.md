# Project Overview

This is a static portfolio website for Randy Counsman, a documentary producer. The site is built with plain HTML, CSS, and JavaScript, and it showcases his work. It features a full-screen video background, a slider for projects, and a contact page. The site is responsive and uses the GSAP library for animations.

# Building and Running

No build step is required. The website can be run by opening the `index.html` file in a web browser.

To run a local server and avoid potential CORS issues with media, you can use Python or Node.js.

**Using Python:**
```sh
python -m http.server 4000
```

**Using Node.js (with `serve` package):**
```sh
npx serve .
```

# Development Conventions

- **JavaScript:** Code is written in plain JavaScript (ES6+). Scripts are loaded as deferred globals. New JavaScript should follow this pattern.
- **CSS:** Styles are written in plain CSS.
- **Assets:** Images, videos, and other assets are stored in the `images/`, `video/`, and `favicon/` directories.
- **Dependencies:** The GSAP animation library is loaded from a CDN.
- **Version Control:** The project uses Git for version control. Commit messages should be small, focused, and imperative (e.g., `add hero video`, `tweak contact form spacing`).
- **Legacy Code:** The `codepen_examples/` and `SDE_Web/website/` directories contain legacy code and experiments. They should not be mixed with the production pages.
