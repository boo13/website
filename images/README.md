# Image Optimization Guide

## ⚠️ REMINDER: Optimize images before committing!

Target file sizes for web:
- Portfolio images: **< 200 KB** (currently some are 1.4 MB!)
- Icons/small images: **< 50 KB**
- Profile photos: **< 100 KB**

---

## Quick Optimization (Run from project root)

### For Portfolio Images

```bash
# Create WebP versions (best compression, modern browsers)
npx @beenotung/sharp-cli@latest \
  --input "images/portfolio-*.jpg" \
  --output "images/" \
  --format webp \
  --quality 85 \
  --width 1920

# Optimize existing JPG files (fallback for older browsers)
npx @beenotung/sharp-cli@latest \
  --input "images/portfolio-*.jpg" \
  --output "images/" \
  --format jpg \
  --quality 75 \
  --width 1920
```

### For All Images (Bulk)

```bash
# Optimize all JPG/PNG files in images/ directory
npx @beenotung/sharp-cli@latest \
  --input "images/**/*.{jpg,jpeg,png}" \
  --output "images/" \
  --format webp \
  --quality 85

npx @beenotung/sharp-cli@latest \
  --input "images/**/*.{jpg,jpeg,png}" \
  --output "images/" \
  --format jpg \
  --quality 75
```

---

## After Optimization

1. **Check file sizes:**
   ```bash
   ls -lh images/portfolio-*.{jpg,webp}
   ```

2. **Update HTML to use WebP with fallback:**
   ```html
   <picture>
     <source srcset="./images/portfolio-1.webp" type="image/webp">
     <img src="./images/portfolio-1.jpg" alt="Project" loading="lazy">
   </picture>
   ```

3. **Commit both formats** (WebP + JPG) for maximum compatibility

---

## Image Specifications

| Type | Max Width | Format | Quality | Target Size |
|------|-----------|--------|---------|-------------|
| Portfolio images | 1920px | WebP/JPG | 85/75 | < 200 KB |
| Profile photo | 800px | WebP/JPG | 85/75 | < 100 KB |
| Icons | N/A | SVG preferred | N/A | < 10 KB |

---

## Current Directory Structure

```
images/
├── portfolio-1.jpg through portfolio-5.jpg  (main slider images)
├── portfolio/                               (named versions)
├── icons/                                   (SVG icons - already optimized)
├── unused/                                  (archived assets)
├── profile-randycounsman.jpg                (profile photo)
└── 1x1black.jpg                             (video poster)
```

---

## Tips

- **Always optimize BEFORE committing** to avoid bloating git history
- Use WebP for 80-90% file size reduction vs JPG
- Keep original high-res images in a separate backup location (not in git)
- SVG icons don't need optimization (already vector-based)
