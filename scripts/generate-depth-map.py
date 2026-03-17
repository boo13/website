#!/usr/bin/env python3
"""Generate pixel-aligned depth map using Depth Anything v2 via transformers."""
from transformers import pipeline
from PIL import Image

input_path = 'public/images/RandyHeroPic.JPG'
output_path = 'public/images/RandyHeroPic-depth.png'

pipe = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf")
img = Image.open(input_path)
result = pipe(img)
depth = result["depth"]  # PIL Image, mode "L" or "I"
# Ensure it's the same size as input and grayscale
depth = depth.resize(img.size, Image.LANCZOS).convert("L")
depth.save(output_path)
print(f"Wrote {output_path} ({depth.size[0]}x{depth.size[1]})")
