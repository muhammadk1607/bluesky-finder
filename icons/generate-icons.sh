#!/bin/bash

GREEN='\e[32m'
RED='\e[31m'
NC='\e[0m'

# Ensure an SVG file is provided
if [ -z "$1" ]; then
	echo "${RED}Usage: $0 <input_file.svg>${NC}"
	exit 1
fi

INPUT_FILE="$1"
BASENAME=$(basename "$INPUT_FILE" .svg)
SIZES=(16 32 48 128)

# Loop through each size
for SIZE in "${SIZES[@]}"; do
	# Generate original color PNG
	convert -background none -resize "${SIZE}"x"${SIZE}" "$INPUT_FILE" "${BASENAME}-${SIZE}.png"

	# Generate grayscale PNG
	convert -background none -resize "${SIZE}"x"${SIZE}" -colorspace Gray "$INPUT_FILE" "${BASENAME}-off-${SIZE}.png"
done

echo "${GREEN}PNG files generated${NC}"
