import numpy as np
from PIL import Image

from image_to_3d_converter import ConversionConfig, convert


def test_conversion_creates_watertight_mesh(tmp_path):
    pixel_values = np.array([[0, 128], [255, 255]], dtype=np.uint8)
    image = Image.fromarray(pixel_values, mode="L")
    image_path = tmp_path / "test.png"
    stl_path = tmp_path / "out.stl"
    image.save(image_path)

    config = ConversionConfig(
        image_path=image_path,
        output_path=stl_path,
        max_height=2.0,
        base_height=1.0,
        pixel_size=1.0,
        invert=False,
    )

    mesh = convert(config)

    assert stl_path.exists()
    assert mesh.is_watertight

    mins, maxs = mesh.bounds
    assert np.isclose(mins[2], 0.0)
    assert np.isclose(maxs[2], 3.0)  # base (1mm) + max height (2mm)
    assert mesh.faces.shape[0] > 0
