# Technical Specifications

## Project Overview

A cinematic, scroll-driven portfolio website for Randy Counsman, a video producer and Creative Director specializing in nonfiction content. The site should feel like a custom-built cinematic journey, not a static portfolio.

---

## System Architecture

### Technology Stack
- **HTML5**: Semantic markup with accessibility considerations
- **CSS3**: Modern layout (Grid, Flexbox), custom properties, transitions
- **JavaScript (ES6+)**: Modular architecture with separate files per feature
- **GSAP 3.12+**: Animation library with ScrollTrigger plugin

### File Structure
```
website/
├── index6.html              # New homepage
├── css/
│   └── styles6.css           # All styles (single file)
├── js/
│   ├── hero-zoom.js         # Z-depth hero transition
│   ├── parallax.js          # Wyatt Earp rack-focus effect
│   ├── gallery.js           # Horizontal scroll gallery
│   └── credits.js           # Hover preview interaction
├── video/
│   ├── LandingPageMontagev04.2.webm
│   ├── Cowboy.War.10secReel.v01_1920x1080.webm
│   └── Capsized.10secReel.v01_1920x1080.webm
├── images/
│   ├── portfolio/           # Key art images
│   │   ├── Wyatt_Layer01_v01.png
│   │   └── Wyatt_Layer02_v01.png
│   └── logos/               # Network logos
└── resume.html              # Existing resume page
```

---

## Data Models and Structures

### Project Data Model
```javascript
const project = {
  id: string,              // Unique identifier
  title: string,           // Project title
  network: string,         // Network name
  networkLogo: string,     // Path to network logo
  role: string,            // Randy's role
  year: number,            // Release year
  thumbnail: string,       // Static thumbnail path
  videoReel: string,       // Video reel path (optional)
  keyArt: string,          // Key art image path
  accolades: string[],     // Awards, rankings, nominations
  quotes: Quote[]          // Press quotes (optional)
};

const quote = {
  text: string,            // Quote content
  source: string           // Publication name
};
```

### Featured Projects (Gallery)
```javascript
const featuredProjects = [
  {
    id: 'mwba',
    title: 'The Men Who Built America',
    network: 'History',
    role: 'Producer',
    year: 2012,
    accolades: ['Emmy-nominated']
  },
  {
    id: 'pope',
    title: 'Pope: The Most Powerful Man in History',
    network: 'CNN',
    role: 'Producer',
    year: 2018
  },
  {
    id: 'capsized',
    title: 'Capsized: Blood in the Water',
    network: 'Discovery',
    role: 'Producer',
    year: 2019
  }
];
```

### Additional Credits
```javascript
const additionalCredits = [
  { title: 'Roman Empire', network: 'Netflix' },
  { title: 'Making of the Mob', network: 'AMC' },
  { title: 'The American West', network: 'AMC' },
  { title: 'American Genius', network: 'Nat Geo' },
  { title: 'American Playboy', network: 'Amazon' },
  { title: 'The World Wars', network: 'History' },
  { title: 'Hamilton: Building America', network: 'History' },
  { title: 'Sitting Bull', network: 'History' },
  { title: 'The Interrogator', network: 'Investigation Discovery' },
  { title: 'Secrets to Success with Daymond John', network: 'CNBC' }
];
```

### Statistics
```javascript
const stats = [
  { value: '15+', unit: 'years', context: 'Bringing nonfiction stories to major networks' },
  { value: '20M+', unit: 'views', context: 'Low-cost interview series featuring MrBeast' },
  { value: 'Top 3', unit: 'Netflix', context: 'Wyatt Earp & The Cowboy War global ranking' },
  { value: 'Emmy', unit: 'nominated', context: 'The World Wars, The Men Who Built America' }
];
```

---

## Section Specifications

### 1. Hero Section

**HTML Structure:**
```html
<section id="hero" class="hero-section">
  <video class="hero-video" autoplay muted loop playsinline>
    <source src="video/LandingPageMontagev04.2.webm" type="video/webm">
  </video>
  <div class="hero-content">
    <h1>Randy Counsman</h1>
    <p class="subtitle">Nonfiction Video Development & Production</p>
    <div class="social-icons">
      <a href="https://linkedin.com/in/randycounsman" aria-label="LinkedIn">...</a>
      <a href="https://vimeo.com/randycounsman" aria-label="Vimeo">...</a>
      <a href="mailto:RandyCounsman@gmail.com" aria-label="Email">...</a>
    </div>
  </div>
</section>
```

**Animation Behavior:**
- Section pinned during scroll
- On scroll progress 0-100%:
  - Hero content z-translates backward (recedes into distance)
  - Scale reduces slightly (0.8-0.5)
  - Opacity fades (1 → 0)
- Next section revealed as hero "opens up"

**GSAP Implementation:**
```javascript
gsap.to('.hero-content', {
  scrollTrigger: {
    trigger: '#hero',
    start: 'top top',
    end: '+=100%',
    pin: true,
    scrub: 1
  },
  z: -500,
  scale: 0.5,
  opacity: 0
});
```

---

### 2. Signature Project: Wyatt Earp

**HTML Structure:**
```html
<section id="wyatt-earp" class="signature-section">
  <div class="parallax-container">
    <img class="layer layer-bg" src="images/portfolio/Wyatt_Layer01_v01.png" alt="">
    <img class="layer layer-fg" src="images/portfolio/Wyatt_Layer02_v01.png" alt="">
    <div class="content-layer">
      <img class="network-logo" src="images/logos/netflix.svg" alt="Netflix">
      <h2>Wyatt Earp and The Cowboy War</h2>
      <div class="quotes">
        <blockquote>"Quote text" <cite>Wall Street Journal</cite></blockquote>
        <blockquote>"Quote text" <cite>The Spectator</cite></blockquote>
        <blockquote>"Quote text" <cite>Decider</cite></blockquote>
      </div>
    </div>
  </div>
</section>
```

**Animation Timeline:**
| Progress | Background Layer | Foreground Layer | Content |
|----------|-----------------|------------------|---------|
| 0-25% | blur: 6px → 0 | blur: 0 (sharp) | fade in |
| 25-75% | parallax Y shift | parallax Y shift (faster) | visible |
| 75-100% | opacity → 0 | opacity → 0 | fade out |

**CSS Requirements:**
```css
.layer-bg {
  filter: blur(6px);
  transform: translateY(0) scale(1.1);
}

.layer-fg {
  filter: blur(0);
  transform: translateY(0) scale(1);
}
```

---

### 3. Featured Works Gallery

**HTML Structure:**
```html
<section id="gallery" class="gallery-section">
  <div class="gallery-track">
    <article class="gallery-card">
      <img class="network-logo" src="..." alt="Network">
      <div class="media-container">
        <img class="thumbnail" src="..." alt="">
        <video class="reel" muted loop preload="none">
          <source src="..." type="video/webm">
        </video>
      </div>
      <h3>Project Title</h3>
      <p class="meta">Role | Year</p>
    </article>
    <!-- Repeat for each project -->
  </div>
</section>
```

**Dimensions:**
- Card width: 60vw
- Card height: 70vh
- Gap between cards: 4vw
- Total track width: (60vw + 4vw) × 3 = 192vw

**Scroll Behavior:**
- Vertical scroll → horizontal track movement
- Pin section while scrolling through gallery
- Track translates X from 0 to -(track-width - 100vw)

**Video Interaction:**
```javascript
card.addEventListener('mouseenter', () => {
  video.play();
});
card.addEventListener('mouseleave', () => {
  video.pause();
  video.currentTime = 0;
});
```

---

### 4. Additional Credits

**HTML Structure:**
```html
<section id="credits" class="credits-section">
  <div class="preview-image" aria-hidden="true">
    <img src="" alt="">
  </div>
  <table class="credits-table">
    <thead>
      <tr><th>Title</th><th>Network</th></tr>
    </thead>
    <tbody>
      <tr data-preview="images/portfolio/roman-empire.jpg">
        <td>Roman Empire</td><td>Netflix</td>
      </tr>
      <!-- Repeat for each credit -->
    </tbody>
  </table>
</section>
```

**Hover Preview Behavior:**
- Preview container: `position: fixed; left: 5vw;`
- On row hover:
  - Load image from `data-preview` attribute
  - Position preview Y to follow cursor
  - Fade in preview (opacity 0 → 1)
- On row leave:
  - Fade out preview

---

### 5. About Section

**HTML Structure:**
```html
<section id="about" class="about-section">
  <div class="stats-grid">
    <div class="stat" data-reveal>
      <span class="stat-value">15+</span>
      <span class="stat-unit">years</span>
      <p class="stat-context">Bringing nonfiction stories to major networks</p>
    </div>
    <!-- Repeat for each stat -->
  </div>

  <div class="logo-marquee">
    <div class="marquee-track">
      <img src="images/logos/netflix.svg" alt="Netflix">
      <img src="images/logos/history.svg" alt="History">
      <!-- All network logos, duplicated for seamless loop -->
    </div>
  </div>

  <p class="summary">Hands-on producer translating strategic direction into premium television, streaming, and social content.</p>

  <a href="/resume.html" class="cta-link">Full Resume →</a>
</section>
```

**Stats Animation:**
```javascript
gsap.from('.stat', {
  scrollTrigger: {
    trigger: '.stats-grid',
    start: 'top 80%'
  },
  y: 50,
  opacity: 0,
  stagger: 0.2
});
```

**Marquee CSS:**
```css
.marquee-track {
  display: flex;
  animation: marquee 30s linear infinite;
}

@keyframes marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
```

**Network Logos (10 total):**
Netflix, History, PBS, AMC, Amazon, Nat Geo, Discovery, CNN, CNBC, Fox Nation

---

### 6. Contact Section

**HTML Structure:**
```html
<section id="contact" class="contact-section">
  <h2>Let's make something</h2>
  <address>
    <p class="location">New York, NY</p>
    <a href="mailto:RandyCounsman@gmail.com">RandyCounsman@gmail.com</a>
    <a href="https://linkedin.com/in/randycounsman">LinkedIn</a>
    <a href="https://vimeo.com/randycounsman">Vimeo</a>
  </address>
</section>
```

---

## Performance Requirements

### Core Web Vitals Targets
| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint (FCP) | <1.5s | Time to first content render |
| Largest Contentful Paint (LCP) | <2.5s | Time to largest element render |
| Cumulative Layout Shift (CLS) | <0.1 | Visual stability score |
| Frame Rate | 60fps | Smooth scroll animations |

### Optimization Strategies

**Video Loading:**
```html
<!-- Hero: Preload for immediate playback -->
<link rel="preload" href="video/LandingPageMontagev04.2.webm" as="video">

<!-- Gallery: Lazy load, no preload -->
<video preload="none" data-src="video/reel.webm">
```

**Image Loading:**
```html
<!-- Above fold: Eager load -->
<img src="..." loading="eager">

<!-- Below fold: Lazy load -->
<img src="..." loading="lazy">
```

**CSS Performance:**
```css
/* Use sparingly on animated elements only */
.hero-content {
  will-change: transform, opacity;
}

/* Remove after animation completes */
.animated-complete {
  will-change: auto;
}
```

**Animation Performance:**
- Use `transform` and `opacity` only (GPU-accelerated)
- Avoid animating `top`, `left`, `width`, `height`
- Use `translateZ(0)` or `translate3d()` for GPU layers

---

## Responsive Design Specifications

### Breakpoints
```css
/* Mobile first */
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
}
```

### Desktop (1024px+)
- Full cinematic experience
- All animations enabled
- Video autoplay on hover
- Horizontal scroll gallery

### Tablet (768px - 1023px)
- Horizontal gallery → vertical swipe gallery
- Reduced parallax movement
- Touch-optimized interactions

### Mobile (<768px)
- Simplified z-zoom (reduced depth)
- Static thumbnails instead of video hover
- Vertical stacked layout throughout
- Reduced animation intensity
- Touch scroll for gallery

### Responsive Component Adjustments

**Gallery Cards:**
```css
.gallery-card {
  width: 60vw;      /* Desktop */
  width: 80vw;      /* Tablet */
  width: 90vw;      /* Mobile */
}
```

**Hero Text:**
```css
h1 {
  font-size: clamp(2.5rem, 8vw, 6rem);
}

.subtitle {
  font-size: clamp(1rem, 3vw, 1.5rem);
}
```

---

## Security Considerations

### Content Security
- No user input forms (contact links only)
- No database or server-side processing
- External links use `rel="noopener noreferrer"`

### Video/Image Hosting
- All media served from same origin
- No external CDN dependencies for media
- GSAP loaded from official CDN with SRI hash

### Accessibility
- All images have descriptive `alt` attributes
- Videos have `aria-label` descriptions
- Interactive elements are keyboard accessible
- Color contrast meets WCAG AA standards
- Reduced motion media query respected

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Integration Requirements

### External Dependencies
| Library | Version | CDN |
|---------|---------|-----|
| GSAP | 3.12+ | https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js |
| ScrollTrigger | 3.12+ | https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js |

### Internal Links
- `/resume.html` - Full resume page
- Network logos in `images/logos/`
- Portfolio images in `images/portfolio/`
- Video reels in `video/`

### External Links
- LinkedIn: https://linkedin.com/in/randycounsman
- Vimeo: https://vimeo.com/randycounsman
- Email: mailto:RandyCounsman@gmail.com

---

## Browser Support

### Required Support
| Browser | Version |
|---------|---------|
| Chrome | Latest 2 versions |
| Safari | Latest 2 versions |
| Firefox | Latest 2 versions |
| iOS Safari | Latest 2 versions |
| Android Chrome | Latest 2 versions |

### Feature Requirements
- CSS Grid and Flexbox
- CSS Custom Properties
- CSS `filter` property
- CSS `transform-style: preserve-3d`
- JavaScript ES6+ (no transpilation needed)
- Intersection Observer API
- WebM video format (with MP4 fallback if needed)
