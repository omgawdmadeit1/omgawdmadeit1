from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
from PIL import Image
import trimesh


@dataclass
class ConversionConfig:
    image_path: Path
    output_path: Path
    max_height: float = 5.0
    base_height: float = 1.0
    pixel_size: float = 0.2
    invert: bool = False


def load_grayscale(image_path: Path) -> np.ndarray:
    """Load an image and return a 2D numpy array normalized to [0, 1]."""
    image = Image.open(image_path).convert("L")
    data = np.asarray(image, dtype=np.float32) / 255.0
    return data


def build_heightmap(image_data: np.ndarray, max_height: float, base_height: float, invert: bool) -> np.ndarray:
    normalized = 1.0 - image_data if invert else image_data
    return base_height + normalized * max_height


def _quad(a: int, b: int, c: int, d: int) -> tuple[tuple[int, int, int], tuple[int, int, int]]:
    """Return two faces that compose a quad (a-b-c-d order)."""
    return (a, b, d), (a, d, c)


def heightmap_to_mesh(heightmap: np.ndarray, pixel_size: float) -> trimesh.Trimesh:
    rows, cols = heightmap.shape
    xs, ys = np.meshgrid(np.arange(cols, dtype=np.float32), np.arange(rows, dtype=np.float32))

    top_vertices = np.column_stack((xs.ravel() * pixel_size, ys.ravel() * pixel_size, heightmap.ravel()))
    bottom_vertices = np.column_stack((xs.ravel() * pixel_size, ys.ravel() * pixel_size, np.zeros_like(heightmap).ravel()))

    vertices = np.vstack((top_vertices, bottom_vertices))

    def t_idx(r: int, c: int) -> int:
        return r * cols + c

    def b_idx(r: int, c: int) -> int:
        return rows * cols + r * cols + c

    faces: list[Iterable[int]] = []

    # Top surface
    for r in range(rows - 1):
        for c in range(cols - 1):
            a, b, c2, d = t_idx(r, c), t_idx(r, c + 1), t_idx(r + 1, c), t_idx(r + 1, c + 1)
            faces.extend(_quad(a, b, c2, d))

    # Bottom surface (reverse winding for outward normals)
    for r in range(rows - 1):
        for c in range(cols - 1):
            a, b, c2, d = b_idx(r, c), b_idx(r, c + 1), b_idx(r + 1, c), b_idx(r + 1, c + 1)
            bottom_faces = [(a, b, d), (a, d, c2)]
            faces.extend([(face[2], face[1], face[0]) for face in bottom_faces])

    # Side walls
    for c in range(cols - 1):
        # North edge (r = 0)
        faces.extend(
            _quad(
                b_idx(0, c),
                b_idx(0, c + 1),
                t_idx(0, c),
                t_idx(0, c + 1),
            )
        )
        # South edge (r = rows - 1)
        faces.extend(
            _quad(
                b_idx(rows - 1, c),
                b_idx(rows - 1, c + 1),
                t_idx(rows - 1, c),
                t_idx(rows - 1, c + 1),
            )
        )

    for r in range(rows - 1):
        # West edge (c = 0)
        faces.extend(
            _quad(
                b_idx(r, 0),
                b_idx(r + 1, 0),
                t_idx(r, 0),
                t_idx(r + 1, 0),
            )
        )
        # East edge (c = cols - 1)
        faces.extend(
            _quad(
                b_idx(r, cols - 1),
                b_idx(r + 1, cols - 1),
                t_idx(r, cols - 1),
                t_idx(r + 1, cols - 1),
            )
        )

    mesh = trimesh.Trimesh(vertices=vertices, faces=np.array(faces, dtype=np.int64), process=True)
    mesh.merge_vertices()
    return mesh


def convert(config: ConversionConfig) -> trimesh.Trimesh:
    image_data = load_grayscale(config.image_path)
    heightmap = build_heightmap(image_data, config.max_height, config.base_height, config.invert)
    mesh = heightmap_to_mesh(heightmap, config.pixel_size)
    mesh.export(config.output_path)
    return mesh


def parse_args() -> ConversionConfig:
    parser = argparse.ArgumentParser(description="Convert an image to an STL heightmap for 3D printing.")
    parser.add_argument("image", type=Path, help="Path to the input image file")
    parser.add_argument("output", type=Path, help="Destination STL path")
    parser.add_argument("--max-height", type=float, default=5.0, help="Maximum height added on top of the base in mm")
    parser.add_argument("--base-height", type=float, default=1.0, help="Base thickness in mm")
    parser.add_argument("--pixel-size", type=float, default=0.2, help="Size of one pixel in mm")
    parser.add_argument("--invert", action="store_true", help="Invert brightness so dark areas are tallest")
    args = parser.parse_args()
    return ConversionConfig(
        image_path=args.image,
        output_path=args.output,
        max_height=args.max_height,
        base_height=args.base_height,
        pixel_size=args.pixel_size,
        invert=args.invert,
    )


def main() -> None:
    config = parse_args()
    convert(config)


if __name__ == "__main__":
    main()
