#!/usr/bin/env bash
# Batch: rename upnext_ -> upNEXT_, convert, and upload to R2
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd -P)"
VIDEO_DIR="${REPO_ROOT}/public/video"
LOG="${REPO_ROOT}/scripts/batch-publish-upnext.log"
TMPDIR_WORK="$(mktemp -d)"

cleanup() {
  rm -rf "${TMPDIR_WORK}"
}
trap cleanup EXIT

echo "=== batch-publish-upnext started at $(date) ===" | tee "${LOG}"
echo "Temp dir: ${TMPDIR_WORK}" | tee -a "${LOG}"

TOTAL=0
DONE=0
FAILED=0
FAILED_LIST=()

# Count files
for src in "${VIDEO_DIR}"/upnext_*.mp4; do
  [[ -f "$src" ]] || continue
  (( TOTAL++ )) || true
done

echo "Files to process: ${TOTAL}" | tee -a "${LOG}"

for src in "${VIDEO_DIR}"/upnext_*.mp4; do
  [[ -f "$src" ]] || continue

  basename="$(basename "$src")"
  oldstem="${basename%.mp4}"
  newname="${basename/upnext_/upNEXT_}"
  newstem="${newname%.mp4}"

  echo "" | tee -a "${LOG}"
  echo "--- [$(( DONE + 1 ))/${TOTAL}] ${basename} -> ${newname} ---" | tee -a "${LOG}"
  echo "  Started: $(date)" | tee -a "${LOG}"

  if bash "${SCRIPT_DIR}/optimize-videos.sh" "$src" --out-dir "${TMPDIR_WORK}" 2>&1 | tee -a "${LOG}"; then
    # Rename outputs from oldstem -> newstem and move to public/video/
    mv "${TMPDIR_WORK}/${oldstem}.webm" "${VIDEO_DIR}/${newstem}.webm"
    mv "${TMPDIR_WORK}/${oldstem}.mp4"  "${VIDEO_DIR}/${newstem}.mp4"

    echo "  Uploading ${newstem}.webm ..." | tee -a "${LOG}"
    if npx wrangler r2 object put "portfolio-assets/video/${newstem}.webm" \
        --file "${VIDEO_DIR}/${newstem}.webm" --content-type "video/webm" --remote 2>&1 | tee -a "${LOG}"; then
      echo "  Uploading ${newstem}.mp4 ..." | tee -a "${LOG}"
      if npx wrangler r2 object put "portfolio-assets/video/${newstem}.mp4" \
          --file "${VIDEO_DIR}/${newstem}.mp4" --content-type "video/mp4" --remote 2>&1 | tee -a "${LOG}"; then
        # Remove original source on success
        rm "$src"
        echo "  Done: removed source ${basename}" | tee -a "${LOG}"
        (( DONE++ )) || true
      else
        echo "  ERROR: upload failed for ${newstem}.mp4" | tee -a "${LOG}"
        FAILED_LIST+=("$basename (mp4 upload)")
        (( FAILED++ )) || true
      fi
    else
      echo "  ERROR: upload failed for ${newstem}.webm" | tee -a "${LOG}"
      FAILED_LIST+=("$basename (webm upload)")
      (( FAILED++ )) || true
    fi
  else
    echo "  ERROR: optimize failed for ${basename}" | tee -a "${LOG}"
    FAILED_LIST+=("$basename (encode)")
    (( FAILED++ )) || true
  fi

  # Clean tmp between files
  rm -f "${TMPDIR_WORK}/${oldstem}".{webm,mp4} 2>/dev/null || true
done

# Rename .webp file separately (no video processing needed)
WEBP_SRC="${VIDEO_DIR}/upnext_Cover_Notes_11.12v2.webp"
if [[ -f "$WEBP_SRC" ]]; then
  mv "$WEBP_SRC" "${VIDEO_DIR}/upNEXT_Cover_Notes_11.12v2.webp"
  echo "" | tee -a "${LOG}"
  echo "Renamed .webp: upnext_Cover_Notes_11.12v2.webp -> upNEXT_Cover_Notes_11.12v2.webp" | tee -a "${LOG}"
fi

echo "" | tee -a "${LOG}"
echo "=== Batch complete at $(date) ===" | tee -a "${LOG}"
echo "  Succeeded: ${DONE}/${TOTAL}" | tee -a "${LOG}"
echo "  Failed:    ${FAILED}" | tee -a "${LOG}"
if [[ ${#FAILED_LIST[@]} -gt 0 ]]; then
  echo "  Failed files:" | tee -a "${LOG}"
  for f in "${FAILED_LIST[@]}"; do
    echo "    - $f" | tee -a "${LOG}"
  done
fi
