"""Build the web copies of the image masters in assets/images.

Run from anywhere:  python tools/build-media.py

- dualsense-*.png  -> dualsense-*.webp  (1600px masters, quality 82)
- *-poster.png     -> *-poster.jpg     (1280x720 posters for canvas sections/videos)

The .png files stay in place as masters; only the derived files are served by the page.
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / "assets" / "images"
POSTER_SIZE = (1280, 720)


def build_photo(master: Path) -> None:
    target = master.with_suffix(".webp")
    im = Image.open(master).convert("RGB")
    im.save(target, "WEBP", quality=82, method=6)
    print(f"{target.name:28} {im.width}x{im.height}  {target.stat().st_size // 1024} KB")


def build_poster(master: Path) -> None:
    target = master.with_name(master.stem + ".jpg")
    im = Image.open(master).convert("RGB").resize(POSTER_SIZE, Image.LANCZOS)
    im.save(target, "JPEG", quality=82, optimize=True, progressive=True)
    print(f"{target.name:28} 1280x720  {target.stat().st_size // 1024} KB")


def main() -> None:
    for master in sorted(IMAGES.glob("dualsense-*.png")):
        build_photo(master)
    for master in sorted(IMAGES.glob("*-poster.png")):
        build_poster(master)


if __name__ == "__main__":
    main()
