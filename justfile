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
