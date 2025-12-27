# V4 - Cinematic "Flying Through Work" Portfolio

## Overview

V4 creates an immersive, cinematic portfolio experience where users "fly through" Randy Counsman's documentary work via scroll-driven zoom transitions. The design emphasizes **fullscreen images** with **small, understated text** over a **dark moody aesthetic**.

## Design Philosophy

**Cinematic Noir Editorial** - Inspired by high-end film publications and museum exhibitions:
- Pure black backgrounds (#000000)
- Warm white/cream accents (#f7f4f0, #e8e3dc)
- Fullscreen images dominate the canvas
- Typography is elegant and minimal (ivypresto-display serif)
- Film grain texture for analog warmth

## Section Flow

```
Hero (Video with Zoom)
  ↓
About (Text Overlay from Blur)
  ↓
Featured Work 1-6 (Chained Zoom Transitions)
  ↓
Gallery (Scrolling Masonry Grid)
  ↓
Newsletter
  ↓
Contact
```

## Technical Architecture

### Core Files

1. **index.html** - Main HTML structure with semantic sections
2. **styles.css** - Complete CSS with 3D perspective containers and responsive design
3. **FeaturedWorkZoom.js** - Class handling zoom transitions for featured work
4. **animations.js** - Main orchestration file coordinating all animations

### Key Technologies

- **GSAP 3.12.4** with ScrollTrigger plugin
- **3D CSS Transforms** with `perspective: 1200px`
- **Intersection Observer** for lazy loading and video management
- **CSS Variables** for consistent theming

### Animation Pattern

Each featured work section follows this 4-phase sequence:

1. **Fade In** (0-1.5s)
   - Network logo appears
   - Project title fades in
   - Quotes stagger in

2. **Hold** (1.5-3.5s)
   - User can read project info
   - Scroll position determines when to proceed

3. **Zoom Out** (scroll-driven)
   - Image scales from 1.0 → 2.5 (2.0 on mobile)
   - Blur increases from 0 → 20px (12px on mobile)
   - Gradient darkens to pure black
   - Content fades out

4. **Transition to Next**
   - Next project emerges from blur (scale 0.8 → 1.0)
   - De-blur from 20px → 0
   - Cycle repeats

### Mobile Optimizations

- **Scale**: 2.0x (vs 2.5x desktop)
- **Blur**: 12px (vs 20px desktop)
- **Simplified animations** for reduced motion preference
- **Lazy loading** for images outside viewport
- **Responsive typography** with clamp()

## Performance Features

### Implemented Optimizations

1. **Lazy Loading**
   - Images load only when entering viewport
   - 50px rootMargin for smooth loading
   - Fallback for browsers without IntersectionObserver

2. **Resource Hints**
   - Preload first featured work image
   - Preload critical network logos
   - Early asset fetching

3. **will-change Management**
   - Applied during animations
   - Removed after completion to free GPU memory

4. **Connection-Aware Loading**
   - Reduces effects on slow-2g/2g connections
   - Adaptive blur values

5. **Page Visibility API**
   - Pauses animations when tab is hidden
   - Resumes on tab focus
   - Saves battery and resources

### Performance Targets

- **60fps** on modern browsers (Chrome, Firefox, Safari)
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Lighthouse Performance Score**: > 90

## Accessibility

- **WCAG 2.1 AA Compliant**
- `prefers-reduced-motion` support (simplified animations)
- Semantic HTML5 structure
- Descriptive alt text for all images
- Keyboard navigation support
- Focus visible states

## Browser Support

- Chrome 90+ ✓
- Firefox 88+ ✓
- Safari 14+ ✓
- Edge 90+ ✓

*Note: 3D transforms and blur effects require modern browsers. Graceful degradation provided.*

## Project Data Structure

Featured work sections expect this data model:

```html
<section class="featured-work" data-project="1">
  <div class="featured-perspective-container">
    <div class="featured-image-wrapper">
      <img src="project-image.jpg" alt="Project Title">
      <div class="featured-gradient"></div>
    </div>
  </div>
  <div class="featured-overlay">
    <img class="network-logo" src="network-logo.png" alt="Network">
    <div class="project-info">
      <h2 class="project-title">Project Title</h2>
      <div class="quotes">
        <blockquote class="quote">
          "Quote text"
          <cite>— Source</cite>
        </blockquote>
      </div>
    </div>
    <div class="project-progress">
      <span class="progress-current">1</span>
      <span class="progress-divider">/</span>
      <span class="progress-total">6</span>
    </div>
  </div>
</section>
```

## Development

### Local Testing

```bash
# Serve locally to avoid CORS issues with video
npx serve .
# or
python -m http.server 4000

# Then open http://localhost:4000/v4/
```

### Debugging

The FeaturedWorkZoom instance is exposed globally for debugging:

```javascript
// In browser console:
window.featuredZoom.currentIndex  // Current project index
window.featuredZoom.timelines     // Array of GSAP timelines
window.featuredZoom.destroy()     // Kill all animations
```

### Modifying Projects

To add/remove featured work sections:

1. Update HTML with new `<section class="featured-work" data-project="N">`
2. Update `progress-total` values in each section
3. Add project images to `/images/` directory
4. No JavaScript changes needed - FeaturedWorkZoom auto-detects sections

## Deployment

1. Commit changes to `gh-pages` branch
2. GitHub Pages automatically deploys
3. Test at: `https://[username].github.io/website/v4/`

## File Structure

```
v4/
├── index.html              # Main HTML (400 lines)
├── styles.css              # All CSS (900 lines)
├── FeaturedWorkZoom.js     # Zoom transition class (175 lines)
├── animations.js           # Orchestration (580 lines)
└── README.md              # This file
```

## Credits

- **Design**: Inspired by index2.html zoom effect
- **Typography**: Adobe Typekit (ivypresto-display, Lato)
- **Animation**: GSAP by GreenSock
- **Film Grain**: SVG noise filter

---

**Built with attention to detail for Randy Counsman's portfolio.**
