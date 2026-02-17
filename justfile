# Merge dev into gh-pages and push to deploy
deploy:
    git checkout gh-pages && git merge dev && git push && git checkout dev

# Optimize a video into WebM + MP4, then upload both to R2
# Example: just video-publish public/video/clip.mov --suffix 360p
video-publish file *ARGS:
    #!/usr/bin/env bash
    set -euo pipefail
    bash scripts/optimize-videos.sh "{{ file }}" {{ ARGS }}
    stem="$(basename "{{ file }}" | sed 's/\.[^.]*$//')"
    suffix="" outdir="public/video"
    args=({{ ARGS }})
    for ((i=0; i<${#args[@]}; i++)); do
      case "${args[i]}" in
        --suffix)  suffix="_${args[i+1]}" ;;
        --out-dir) outdir="${args[i+1]}" ;;
      esac
    done
    for ext in webm mp4; do
      f="${outdir}/${stem}${suffix}.${ext}"
      echo "Uploading $(basename "$f") → portfolio-assets/video/$(basename "$f")"
      npx wrangler r2 object put "portfolio-assets/video/$(basename "$f")" \
          --file "$f" --content-type "video/${ext}" --remote
    done

# Run a full visual audit across desktop, tablet, and phone sizes
visual-audit:
    #!/usr/bin/env bash
    set -euo pipefail
    # Check if dev server is up
    if ! curl -s --head http://localhost:5173/ > /dev/null; then
      echo "Error: Local dev server is not running on http://localhost:5173/"
      echo "Run 'npm run dev' in another terminal first."
      exit 1
    fi
    playwright-cli open
    for size in desktop tablet phone; do
      echo "--- Capturing $size ---"
      case $size in
        desktop) w=1440; h=900 ;;
        tablet)  w=768;  h=1024 ;;
        phone)   w=390;  h=844 ;;
      esac
      playwright-cli resize $w $h
      playwright-cli run-code "$(cat scripts/capture-visual-audit.js)"
    done
    playwright-cli close
