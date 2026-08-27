#!/usr/bin/env bash
# =============================================================================
# Ausführen mit: ./process-images.sh

# Erstellt aus neuen Bildern in assets/images/gallery/originals/ automatisch:
#   - thumbs/     600px breit  (für Masonry-Grid)
#   - previews/   1800px breit (für Modal-Vorschau)
#   - downloads/  Originalgröße, EXIF auf Kamera-Einstellungen/Zeit/Ort bereinigt
#
# Voraussetzungen (einmalig installieren):
#   brew install imagemagick exiftool
# =============================================================================

set -euo pipefail

GALLERY_DIR="assets/images/gallery"
ORIGINALS_DIR="${GALLERY_DIR}/originals"
THUMBS_DIR="${GALLERY_DIR}/thumbs"
PREVIEWS_DIR="${GALLERY_DIR}/previews"
DOWNLOADS_DIR="${GALLERY_DIR}/downloads"

# --- Abhängigkeiten prüfen ---
if ! command -v magick &>/dev/null; then
  echo "❌ ImageMagick nicht gefunden. Bitte installieren: brew install imagemagick"
  exit 1
fi
if ! command -v exiftool &>/dev/null; then
  echo "❌ exiftool nicht gefunden. Bitte installieren: brew install exiftool"
  exit 1
fi

# --- Ordner anlegen falls nicht vorhanden ---
mkdir -p "$THUMBS_DIR" "$PREVIEWS_DIR" "$DOWNLOADS_DIR"

# --- Bilder verarbeiten ---
shopt -s nullglob
images=("${ORIGINALS_DIR}"/*.{jpg,jpeg,JPG,JPEG,png,PNG})

if [[ ${#images[@]} -eq 0 ]]; then
  echo "ℹ️  Keine Bilder in ${ORIGINALS_DIR} gefunden."
  exit 0
fi

processed=0
skipped=0

for src in "${images[@]}"; do
  filename=$(basename "$src")
  base="${filename%.*}"
  ext="${filename##*.}"
  ext_lower=$(echo "$ext" | tr '[:upper:]' '[:lower:]')

  thumb="${THUMBS_DIR}/${base}.jpg"
  preview="${PREVIEWS_DIR}/${base}.jpg"
  download="${DOWNLOADS_DIR}/${base}.jpg"

  # Nur verarbeiten wenn thumb noch nicht existiert
  if [[ -f "$thumb" ]]; then
    ((skipped++)) || true
    continue
  fi

  echo "📷 Verarbeite: ${filename}"

  # Thumb: max 600px breit, kein Upscaling (>), JPEG 85%
  magick "$src" -resize "600x>" -quality 85 "$thumb"
  echo "   ✅ thumb"

  # Preview: max 1800px breit, kein Upscaling (>), JPEG 88%
  magick "$src" -resize "1800x>" -quality 88 "$preview"
  echo "   ✅ preview"

  # Download: Originalgröße, nur relevante EXIF-Tags behalten
  # Behalten: Kamera-Einstellungen, Aufnahmezeitpunkt, GPS-Koordinaten
  cp "$src" "$download"
  exiftool -overwrite_original \
    -all= \
    -TagsFromFile "$src" \
    -ExposureTime \
    -FNumber \
    -ISO \
    -FocalLength \
    -FocalLengthIn35mmFormat \
    -ExposureProgram \
    -MeteringMode \
    -Flash \
    -WhiteBalance \
    -DateTimeOriginal \
    -CreateDate \
    -OffsetTimeOriginal \
    -GPSLatitude \
    -GPSLatitudeRef \
    -GPSLongitude \
    -GPSLongitudeRef \
    -GPSAltitude \
    -GPSAltitudeRef \
    -GPSDateStamp \
    -GPSTimeStamp \
    "$download" 2>/dev/null
  echo "   ✅ download (EXIF bereinigt)"

  ((processed++)) || true
done

echo ""
echo "✅ Fertig: ${processed} Bild(er) verarbeitet, ${skipped} übersprungen (bereits vorhanden)."
