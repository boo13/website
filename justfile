# Merge dev into gh-pages and push to deploy
deploy:
    git checkout gh-pages && git merge dev && git push && git checkout dev

# Merge a feature-branch worktree into gh-pages, push, then remove the worktree and branch.
# Run from any worktree of this repo. Branch must already have its changes committed.
# Example: just ship-worktree pumice-dune
ship-worktree branch:
    #!/usr/bin/env bash
    set -euo pipefail

    branch="{{ branch }}"

    if ! git show-ref --verify --quiet "refs/heads/$branch"; then
        echo "Error: branch '$branch' does not exist"
        exit 1
    fi

    # cd to the main worktree so we don't yank our own cwd when removing a worktree we're standing in.
    main_worktree=$(git worktree list | head -n 1 | awk '{print $1}')
    cd "$main_worktree"

    # Resolve the worktree path for the branch being shipped (if any).
    worktree_path=$(git worktree list --porcelain | awk -v b="refs/heads/$branch" '
        /^worktree / {path=$2}
        $0 == "branch " b {print path; exit}
    ')

    echo "Merging '$branch' into gh-pages..."
    git checkout gh-pages
    git merge "$branch" --no-ff -m "Merge branch '$branch' into gh-pages"
    git push origin gh-pages
    git checkout dev

    if [ -n "$worktree_path" ]; then
        echo "Removing worktree at $worktree_path..."
        git worktree remove "$worktree_path"
    fi

    echo "Deleting branch '$branch'..."
    git branch -D "$branch"

    echo "Done."

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

# Generate Gemini cover art for any playlist missing a cover image
cover-gen *ARGS:
    node scripts/generate-playlist-covers.mjs {{ ARGS }}

# Scaffold a new project detail page from Projects.json
project-scaffold id:
    node scripts/scaffold-project.mjs {{ id }}

# Scaffold a new password-protected portfolio variant
portfolio-scaffold slug:
    node scripts/scaffold-portfolio.mjs {{ slug }}

# Encrypt a portfolio data file for deployment (reads .env for password)
portfolio-encrypt slug:
    node scripts/encrypt-portfolio.mjs {{ slug }}

# Encrypt all portfolio variants (reads .env for each password)
portfolio-encrypt-all:
    #!/usr/bin/env bash
    set -euo pipefail
    for f in portfolio-data/*.json; do
      slug="$(basename "$f" .json)"
      echo "Encrypting $slug..."
      node scripts/encrypt-portfolio.mjs "$slug"
    done

# Generate .thumb.webp + .large.webp derivatives for portfolio images and delete originals
# Example: just images-optimize
#          just images-optimize public/images/portfolio/pitch-vin-diesel
images-optimize *ARGS:
    node scripts/optimize-portfolio-images.mjs {{ ARGS }}

# Deploy the portfolio-unlock Cloudflare Worker
worker-deploy:
    cd worker/portfolio-unlock && npx wrangler deploy

# Deploy the homepage-visit Cloudflare Worker
worker-deploy-homepage:
    cd worker/homepage-visit && npx wrangler deploy

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
