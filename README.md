# Image → 3D-print STL converter

Convert any image into a 3D-printable STL heightmap with a CLI built on Pillow, NumPy, and trimesh.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

## Usage

```bash
python image_to_3d_converter.py input.png output.stl \
  --max-height 5.0 \    # millimeters on top of the base
  --base-height 1.0 \   # base plate thickness in millimeters
  --pixel-size 0.2 \    # XY size of one pixel in millimeters
  --invert              # optional: make darker pixels taller
```

Tips:

- Use high-contrast grayscale images for crisp heightmaps.
- The base height ensures the thinnest areas remain printable.
- The output STL is watertight and ready for your slicer.
