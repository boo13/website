#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd -P)"

DEFAULT_OUT_DIR="${REPO_ROOT}/public/video"
MAX_WIDTH=""
MAX_HEIGHT=""
MAX_WIDTH_SET=false
MAX_HEIGHT_SET=false
SUFFIX=""
OUT_DIR="${DEFAULT_OUT_DIR}"
OVERWRITE=false
DRY_RUN=false
REMOVE_AUDIO=false
INPUT_FILE=""

usage() {
  cat <<'EOF'
Usage:
  scripts/optimize-videos.sh INPUT_FILE [--suffix SUFFIX] [--out-dir DIR] [--max-width N] [--max-height N] [--overwrite] [--no-audio] [--dry-run]

Options:
  --suffix SUFFIX    Append _SUFFIX to output stem (example: 360p, 9x16)
  --out-dir DIR      Output directory (default: <repo>/public/video)
  --max-width N      Max output width (default: source width)
  --max-height N     Max output height (default: source height)
  --overwrite        Overwrite existing output files
  --no-audio         Strip audio from outputs even if input has audio
  --dry-run          Print commands without running ffmpeg
  -h, --help         Show this help message
EOF
}

die() {
  echo "Error: $*" >&2
  exit 1
}

require_command() {
  local command_name="$1"
  command -v "${command_name}" >/dev/null 2>&1 || die "Missing dependency: ${command_name}"
}

require_encoder() {
  local encoder_name="$1"
  ffmpeg -hide_banner -loglevel error -h "encoder=${encoder_name}" >/dev/null 2>&1 || die "Missing ffmpeg encoder: ${encoder_name}"
}

is_positive_integer() {
  [[ "$1" =~ ^[1-9][0-9]*$ ]]
}

run_cmd() {
  printf '+ '
  printf '%q ' "$@"
  printf '\n'
  if [[ "${DRY_RUN}" == "false" ]]; then
    "$@"
  fi
}

file_size_bytes() {
  local file_path="$1"
  if stat -f%z "${file_path}" >/dev/null 2>&1; then
    stat -f%z "${file_path}"
  else
    stat -c%s "${file_path}"
  fi
}

human_size() {
  local bytes="$1"
  awk -v b="${bytes}" '
    BEGIN {
      split("B KB MB GB TB", units, " ")
      size = b + 0
      idx = 1
      while (size >= 1024 && idx < 5) {
        size /= 1024
        idx++
      }
      if (idx == 1) {
        printf "%d %s\n", size, units[idx]
      } else {
        printf "%.2f %s\n", size, units[idx]
      }
    }
  '
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --suffix)
      [[ $# -ge 2 ]] || die "--suffix requires a value"
      SUFFIX="$2"
      shift 2
      ;;
    --out-dir)
      [[ $# -ge 2 ]] || die "--out-dir requires a value"
      OUT_DIR="$2"
      shift 2
      ;;
    --max-width)
      [[ $# -ge 2 ]] || die "--max-width requires a value"
      MAX_WIDTH="$2"
      MAX_WIDTH_SET=true
      shift 2
      ;;
    --max-height)
      [[ $# -ge 2 ]] || die "--max-height requires a value"
      MAX_HEIGHT="$2"
      MAX_HEIGHT_SET=true
      shift 2
      ;;
    --overwrite)
      OVERWRITE=true
      shift
      ;;
    --no-audio|--remove-audio)
      REMOVE_AUDIO=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --)
      shift
      break
      ;;
    -*)
      die "Unknown option: $1"
      ;;
    *)
      if [[ -z "${INPUT_FILE}" ]]; then
        INPUT_FILE="$1"
        shift
      else
        die "Unexpected argument: $1"
      fi
      ;;
  esac
done

if [[ $# -gt 0 ]]; then
  if [[ -z "${INPUT_FILE}" ]]; then
    INPUT_FILE="$1"
    shift
  fi
  [[ $# -eq 0 ]] || die "Unexpected argument: $1"
fi

[[ -n "${INPUT_FILE}" ]] || {
  usage
  die "INPUT_FILE is required"
}

require_command ffmpeg
require_command ffprobe
require_encoder libvpx-vp9
require_encoder libx264

[[ -f "${INPUT_FILE}" ]] || die "Input file not found: ${INPUT_FILE}"
if [[ "${MAX_WIDTH_SET}" == "true" ]]; then
  is_positive_integer "${MAX_WIDTH}" || die "--max-width must be a positive integer"
fi
if [[ "${MAX_HEIGHT_SET}" == "true" ]]; then
  is_positive_integer "${MAX_HEIGHT}" || die "--max-height must be a positive integer"
fi

if ! ffprobe -v error -select_streams v:0 -show_entries stream=codec_type -of csv=p=0 "${INPUT_FILE}" | grep -q '^video$'; then
  die "Input file has no readable video stream: ${INPUT_FILE}"
fi

INPUT_DIMENSIONS="$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "${INPUT_FILE}" || true)"
[[ -n "${INPUT_DIMENSIONS}" ]] || die "Could not read input dimensions: ${INPUT_FILE}"
INPUT_WIDTH="${INPUT_DIMENSIONS%x*}"
INPUT_HEIGHT="${INPUT_DIMENSIONS#*x}"
is_positive_integer "${INPUT_WIDTH}" || die "Invalid input width from ffprobe: ${INPUT_WIDTH}"
is_positive_integer "${INPUT_HEIGHT}" || die "Invalid input height from ffprobe: ${INPUT_HEIGHT}"

HAS_AUDIO=false
if ffprobe -v error -select_streams a:0 -show_entries stream=codec_type -of csv=p=0 "${INPUT_FILE}" | grep -q '^audio$'; then
  HAS_AUDIO=true
fi

INCLUDE_AUDIO=false
if [[ "${HAS_AUDIO}" == "true" && "${REMOVE_AUDIO}" == "false" ]]; then
  INCLUDE_AUDIO=true
  require_encoder libopus
  require_encoder aac
fi

INPUT_BASENAME="$(basename "${INPUT_FILE}")"
INPUT_STEM="${INPUT_BASENAME%.*}"

if [[ -n "${SUFFIX}" ]]; then
  SUFFIX="${SUFFIX#_}"
  OUTPUT_STEM="${INPUT_STEM}_${SUFFIX}"
else
  OUTPUT_STEM="${INPUT_STEM}"
fi

WEBM_OUTPUT="${OUT_DIR}/${OUTPUT_STEM}.webm"
MP4_OUTPUT="${OUT_DIR}/${OUTPUT_STEM}.mp4"

if [[ "${OVERWRITE}" == "false" ]]; then
  [[ ! -e "${WEBM_OUTPUT}" ]] || die "Output already exists (use --overwrite): ${WEBM_OUTPUT}"
  [[ ! -e "${MP4_OUTPUT}" ]] || die "Output already exists (use --overwrite): ${MP4_OUTPUT}"
fi

if [[ "${DRY_RUN}" == "false" ]]; then
  mkdir -p "${OUT_DIR}"
else
  echo "Dry run: output directory creation skipped (would ensure): ${OUT_DIR}"
fi

if [[ "${OVERWRITE}" == "true" ]]; then
  FFMPEG_OUTPUT_FLAG=(-y)
else
  FFMPEG_OUTPUT_FLAG=(-n)
fi

if [[ "${MAX_WIDTH_SET}" == "false" ]]; then
  MAX_WIDTH="${INPUT_WIDTH}"
fi
if [[ "${MAX_HEIGHT_SET}" == "false" ]]; then
  MAX_HEIGHT="${INPUT_HEIGHT}"
fi

USE_SCALING=false
SCALE_FILTER=""
VIDEO_FILTER_ARGS=()
if [[ "${MAX_WIDTH_SET}" == "true" || "${MAX_HEIGHT_SET}" == "true" ]]; then
  USE_SCALING=true
  SCALE_FILTER="scale=w=min(iw\\,${MAX_WIDTH}):h=min(ih\\,${MAX_HEIGHT}):force_original_aspect_ratio=decrease:force_divisible_by=2"
  VIDEO_FILTER_ARGS=(-vf "${SCALE_FILTER}")
fi

echo "Video optimization settings:"
echo "  input: ${INPUT_FILE}"
echo "  input dimensions: ${INPUT_DIMENSIONS:-unknown}"
echo "  output WebM: ${WEBM_OUTPUT}"
echo "  output MP4: ${MP4_OUTPUT}"
if [[ "${USE_SCALING}" == "true" ]]; then
  echo "  scale filter: ${SCALE_FILTER}"
  echo "  max dimensions: ${MAX_WIDTH}x${MAX_HEIGHT}"
else
  echo "  scale filter: none (preserving source frame size)"
  echo "  output dimensions: source size (${INPUT_WIDTH}x${INPUT_HEIGHT})"
fi
echo "  overwrite: ${OVERWRITE}"
echo "  remove audio: ${REMOVE_AUDIO}"
echo "  dry run: ${DRY_RUN}"
if [[ "${INCLUDE_AUDIO}" == "true" ]]; then
  echo "  audio stream: detected (first track only; Opus 128k for WebM, AAC 128k for MP4)"
elif [[ "${HAS_AUDIO}" == "true" ]]; then
  echo "  audio stream: stripped from outputs (--no-audio)"
else
  echo "  audio stream: none detected (video-only outputs)"
fi
echo "  VP9 settings: libvpx-vp9 one-pass, crf=33, b:v=0, row-mt=1, deadline=good"
echo "  H.264 settings: libx264, crf=22, preset=slow, yuv420p, +faststart"

if [[ "${INCLUDE_AUDIO}" == "true" ]]; then
  run_cmd ffmpeg -hide_banner -loglevel warning "${FFMPEG_OUTPUT_FLAG[@]}" -i "${INPUT_FILE}" \
    -map 0:v:0 -map 0:a:0? \
    ${VIDEO_FILTER_ARGS[@]+"${VIDEO_FILTER_ARGS[@]}"} \
    -c:v libvpx-vp9 -pix_fmt yuv420p -row-mt 1 -deadline good -cpu-used 2 -b:v 0 -crf 33 \
    -c:a libopus -b:a 128k \
    "${WEBM_OUTPUT}"

  run_cmd ffmpeg -hide_banner -loglevel warning "${FFMPEG_OUTPUT_FLAG[@]}" -i "${INPUT_FILE}" \
    -map 0:v:0 -map 0:a:0? \
    ${VIDEO_FILTER_ARGS[@]+"${VIDEO_FILTER_ARGS[@]}"} \
    -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p \
    -c:a aac -b:a 128k \
    -movflags +faststart \
    "${MP4_OUTPUT}"
else
  run_cmd ffmpeg -hide_banner -loglevel warning "${FFMPEG_OUTPUT_FLAG[@]}" -i "${INPUT_FILE}" \
    -map 0:v:0 -an \
    ${VIDEO_FILTER_ARGS[@]+"${VIDEO_FILTER_ARGS[@]}"} \
    -c:v libvpx-vp9 -pix_fmt yuv420p -row-mt 1 -deadline good -cpu-used 2 -b:v 0 -crf 33 \
    "${WEBM_OUTPUT}"

  run_cmd ffmpeg -hide_banner -loglevel warning "${FFMPEG_OUTPUT_FLAG[@]}" -i "${INPUT_FILE}" \
    -map 0:v:0 -an \
    ${VIDEO_FILTER_ARGS[@]+"${VIDEO_FILTER_ARGS[@]}"} \
    -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p \
    -movflags +faststart \
    "${MP4_OUTPUT}"
fi

if [[ "${DRY_RUN}" == "true" ]]; then
  echo "Dry run complete: no files were written."
  exit 0
fi

[[ -f "${WEBM_OUTPUT}" ]] || die "WebM output missing after encode: ${WEBM_OUTPUT}"
[[ -f "${MP4_OUTPUT}" ]] || die "MP4 output missing after encode: ${MP4_OUTPUT}"

WEBM_SIZE_BYTES="$(file_size_bytes "${WEBM_OUTPUT}")"
MP4_SIZE_BYTES="$(file_size_bytes "${MP4_OUTPUT}")"

echo "Optimization complete:"
echo "  ${WEBM_OUTPUT} ($(human_size "${WEBM_SIZE_BYTES}"))"
echo "  ${MP4_OUTPUT} ($(human_size "${MP4_SIZE_BYTES}"))"
