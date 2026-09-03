#!/usr/bin/env python3
"""Build the approved 40-asset LeonSal five-state pilot.

This script intentionally handles only the eight user-approved Energy Lab
characters. It creates one 512x512 RGBA PNG per character/state, verifies real
transparency, updates the production registry, and patches the homepage to load
selector/Dash artwork support.
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "source-safe-keeping" / "approved-character-sheets"
OUT = ROOT / "assets" / "characters-v2"
QA = OUT / "pilot-qa"
REGISTRY = ROOT / "data" / "character-assets.json"
INDEX = ROOT / "index.html"
STATES = ["empty", "low", "calm", "happy", "excited"]
CANVAS = 512

GUIDES = {
    "leon": {
        "displayName": "Leon",
        "file": "leon-five-state-large.jpg",
        "boxes": [
            (0, 155, 310, 705),
            (310, 155, 575, 705),
            (575, 155, 840, 705),
            (840, 140, 1125, 705),
            (1125, 120, 1491, 705),
        ],
    },
    "zaya": {
        "displayName": "Zaya",
        "file": "zaya-five-state-large.jpg",
        "boxes": [
            (0, 140, 310, 700),
            (310, 140, 575, 700),
            (575, 130, 840, 700),
            (840, 120, 1125, 700),
            (1125, 90, 1491, 700),
        ],
    },
}

WORLD = [
    ("battery-buddy", "Battery Buddy"),
    ("elephant", "Elephant"),
    ("double-decker", "Double-decker Bus"),
    ("plane", "Plane"),
    ("boat", "Boat"),
    ("letter-a", "Letter A"),
]
WORLD_FILE = "world-core-battery-elephant-bus-plane-boat-letter-a.jpg"
WORLD_X = [160, 370, 555, 740, 920, 1122]
# source row start, source row end, first y pixel belonging to the badge/label
WORLD_ROWS = [
    (0, 260, 212),
    (250, 480, 452),
    (480, 690, 670),
    (690, 920, 890),
    (920, 1145, 1098),
    (1140, 1402, 1335),
]


def connected_border_background(rgb: np.ndarray) -> np.ndarray:
    """Return alpha with only near-white regions connected to canvas edges removed."""
    minimum = rgb.min(axis=2)
    maximum = rgb.max(axis=2)

    strict = (minimum >= 245) & ((maximum - minimum) <= 20)
    _, labels = cv2.connectedComponents(strict.astype(np.uint8), 8)
    border_ids = np.unique(
        np.concatenate((labels[0], labels[-1], labels[:, 0], labels[:, -1]))
    )
    background = np.isin(labels, border_ids) & strict

    alpha = np.full(background.shape, 255, np.uint8)
    alpha[background] = 0

    # Anti-alias the edge using a wider near-white mask, still limited to the
    # outside-connected background so white eyes/gloves/shoes are preserved.
    soft_candidate = (minimum >= 225) & ((maximum - minimum) <= 35)
    _, soft_labels = cv2.connectedComponents(soft_candidate.astype(np.uint8), 8)
    soft_border_ids = np.unique(
        np.concatenate(
            (soft_labels[0], soft_labels[-1], soft_labels[:, 0], soft_labels[:, -1])
        )
    )
    soft_background = np.isin(soft_labels, soft_border_ids) & soft_candidate
    soft_only = soft_background & ~background
    whiteness = ((rgb.mean(axis=2) - 225) / 30 * 255).clip(0, 255)
    alpha[soft_only] = np.minimum(
        alpha[soft_only], (255 - whiteness[soft_only]).astype(np.uint8)
    )
    return cv2.GaussianBlur(alpha, (3, 3), 0)


def isolate_primary_subject(rgba: Image.Image, threshold: int = 150) -> Image.Image:
    """Keep one primary connected subject and discard labels/neighbours."""
    array = np.array(rgba.convert("RGBA"))
    alpha = array[:, :, 3]
    core = (alpha > threshold).astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(core, 8)
    if count <= 1:
        return rgba

    primary = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    mask = (labels == primary).astype(np.uint8) * 255
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    mask = cv2.dilate(mask, np.ones((5, 5), np.uint8), iterations=1)
    envelope = cv2.GaussianBlur(mask, (5, 5), 0.8)
    array[:, :, 3] = np.where(
        envelope > 0, np.maximum(alpha, envelope), 0
    ).astype(np.uint8)
    return Image.fromarray(array, "RGBA")


def remove_thin_bottom_artifacts(image: Image.Image) -> Image.Image:
    """Remove leftover infographic underline fragments without touching the subject."""
    array = np.array(image.convert("RGBA"))
    alpha = array[:, :, 3]
    height, width = alpha.shape
    mask = (alpha > 40).astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
    for component in range(1, count):
        x, y, w, h, _ = stats[component]
        if y > height * 0.72 and w > width * 0.12 and h <= 10 and w / max(h, 1) > 5:
            array[:, :, 3][labels == component] = 0
    return Image.fromarray(array, "RGBA")


def centre_on_canvas(image: Image.Image, padding: float = 0.055) -> Image.Image:
    array = np.array(image.convert("RGBA"))
    alpha = array[:, :, 3]
    ys, xs = np.where(alpha > 2)
    if not len(xs):
        raise RuntimeError("Subject extraction produced an empty image")
    subject = image.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
    available = int(CANVAS * (1 - 2 * padding))
    scale = min(available / subject.width, available / subject.height)
    size = (max(1, round(subject.width * scale)), max(1, round(subject.height * scale)))
    subject = subject.resize(size, Image.Resampling.LANCZOS)
    output = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    output.alpha_composite(subject, ((CANVAS - size[0]) // 2, (CANVAS - size[1]) // 2))
    return output


def extract_subject(source: Image.Image, box: tuple[int, int, int, int], cutoff: int | None = None) -> Image.Image:
    crop = source.crop(box).convert("RGB")
    rgb = np.array(crop)
    alpha = connected_border_background(rgb)
    rgba = Image.fromarray(np.dstack((rgb, alpha)), "RGBA")
    if cutoff is not None:
        array = np.array(rgba)
        array[cutoff:, :, 3] = 0
        rgba = Image.fromarray(array, "RGBA")
    rgba = isolate_primary_subject(rgba)
    rgba = remove_thin_bottom_artifacts(rgba)
    return centre_on_canvas(rgba)


def verify_png(path: Path) -> None:
    image = Image.open(path).convert("RGBA")
    if image.size != (CANVAS, CANVAS):
        raise RuntimeError(f"{path}: expected {CANVAS}x{CANVAS}, got {image.size}")
    alpha = np.array(image.getchannel("A"))
    if not np.any(alpha == 0) or not np.any(alpha > 0):
        raise RuntimeError(f"{path}: image does not contain real transparency and subject pixels")
    if any(int(alpha[y, x]) != 0 for x, y in ((0, 0), (CANVAS - 1, 0), (0, CANVAS - 1), (CANVAS - 1, CANVAS - 1))):
        raise RuntimeError(f"{path}: all canvas corners must be transparent")
    ys, xs = np.where(alpha > 10)
    if xs.min() < 12 or ys.min() < 12 or xs.max() > CANVAS - 13 or ys.max() > CANVAS - 13:
        raise RuntimeError(f"{path}: subject does not have safe transparent padding")


def state_paths(base: str) -> dict[str, str]:
    return {state: f"assets/characters-v2/{base}/{state}.png" for state in STATES}


def build_assets() -> tuple[list[dict], list[dict]]:
    if OUT.exists():
        # Preserve pilot QA documentation while ensuring no stale runtime asset survives.
        for child in OUT.iterdir():
            if child.name != "pilot-qa":
                if child.is_dir():
                    shutil.rmtree(child)
                else:
                    child.unlink()
    OUT.mkdir(parents=True, exist_ok=True)
    QA.mkdir(parents=True, exist_ok=True)

    guide_records: list[dict] = []
    for slug, spec in GUIDES.items():
        source_path = SOURCE / spec["file"]
        source = Image.open(source_path)
        if source.size != (1491, 1055):
            raise RuntimeError(f"{source_path}: unexpected dimensions {source.size}")
        destination = OUT / slug
        destination.mkdir(parents=True, exist_ok=True)
        for state, box in zip(STATES, spec["boxes"], strict=True):
            path = destination / f"{state}.png"
            extract_subject(source, box).save(path, "PNG", optimize=True)
            verify_png(path)
        guide_records.append(
            {
                "id": slug,
                "displayName": spec["displayName"],
                "family": "guide",
                "status": "approved",
                "format": "png-rgba",
                "states": state_paths(slug),
                "notes": "Individual transparent five-state pilot asset generated from the user-approved source sheet and pixel-verified.",
            }
        )

    source_path = SOURCE / WORLD_FILE
    source = Image.open(source_path)
    if source.size != (1122, 1402):
        raise RuntimeError(f"{source_path}: unexpected dimensions {source.size}")

    world_records: list[dict] = []
    for row, ((slug, display_name), (top, bottom, badge_top)) in enumerate(zip(WORLD, WORLD_ROWS, strict=True)):
        destination = OUT / "world" / slug
        destination.mkdir(parents=True, exist_ok=True)
        for column, state in enumerate(STATES):
            box = (WORLD_X[column], top, WORLD_X[column + 1], bottom)
            path = destination / f"{state}.png"
            image = extract_subject(source, box, cutoff=badge_top - top)
            image.save(path, "PNG", optimize=True)
            verify_png(path)
        world_records.append(
            {
                "id": slug,
                "displayName": display_name,
                "family": "world",
                "status": "approved",
                "format": "png-rgba",
                "states": state_paths(f"world/{slug}"),
                "notes": "Individual transparent five-state pilot asset generated from the user-approved source sheet and pixel-verified.",
            }
        )

    return guide_records, world_records


def write_registry(guides: list[dict], world: list[dict]) -> None:
    registry = {
        "version": 2,
        "states": STATES,
        "guides": guides,
        "alphabet": [],
        "numbers": [],
        "world": world,
        "pilot": guides + world,
        "missing": [
            {
                "families": ["alphabet-a-z", "numbers-1-10", "remaining-world-characters"],
                "status": "needs-approved-individual-transparent-masters",
                "notes": "Review sheets are not production sprites and remain blocked from runtime until separately approved.",
            }
        ],
    }
    REGISTRY.write_text(json.dumps(registry, indent=2) + "\n", encoding="utf-8")


def checkerboard(size: tuple[int, int], tile: int = 16) -> Image.Image:
    image = Image.new("RGBA", size, (255, 255, 255, 255))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], tile):
        for x in range(0, size[0], tile):
            if (x // tile + y // tile) % 2:
                draw.rectangle((x, y, x + tile - 1, y + tile - 1), fill=(220, 220, 220, 255))
    return image


def write_qa_sheet() -> None:
    characters = ["leon", "zaya"] + [slug for slug, _ in WORLD]
    cell = 240
    sheet = checkerboard((cell * len(STATES), cell * len(characters)))
    for row, character in enumerate(characters):
        base = OUT / character if character in GUIDES else OUT / "world" / character
        for column, state in enumerate(STATES):
            image = Image.open(base / f"{state}.png").convert("RGBA")
            image.thumbnail((cell - 12, cell - 12))
            sheet.alpha_composite(
                image,
                (
                    column * cell + (cell - image.width) // 2,
                    row * cell + (cell - image.height) // 2,
                ),
            )
    sheet.convert("RGB").save(QA / "pilot-40-checkerboard.jpg", "JPEG", quality=90)
    (QA / "README.md").write_text(
        "# LeonSal character-art pilot v2\n\n"
        "This directory contains the review-only checkerboard sheet. Runtime uses "
        "the individual transparent PNG files under `assets/characters-v2/`.\n",
        encoding="utf-8",
    )


def patch_index() -> None:
    html = INDEX.read_text(encoding="utf-8")
    css_link = '  <link rel="stylesheet" href="css/character-art-v2.css">\n'
    if "css/character-art-v2.css" not in html:
        html = html.replace("</head>", css_link + "</head>")
    script = '  <script src="js/character-art-v2-enhancements.js" defer></script>\n'
    if "js/character-art-v2-enhancements.js" not in html:
        html = html.replace("</body>", script + "</body>")
    html = html.replace(
        "<strong>42 characters are ready now:</strong> six 3D favourites, all 26 alphabet letters and all 10 number characters. Each can charge, sleep, move, breathe, feel and draw.",
        "<strong>Eight characters now have approved five-state artwork:</strong> Leon, Zaya, Battery Buddy, Elephant, Double-decker, Plane, Boat and Letter A. Alphabet and number packs remain available as learning choices while their final transparent art is prepared.",
    )
    INDEX.write_text(html, encoding="utf-8")


def main() -> None:
    guides, world = build_assets()
    write_registry(guides, world)
    write_qa_sheet()
    patch_index()
    print(f"Built and verified {(len(guides) + len(world)) * len(STATES)} transparent PNG assets.")


if __name__ == "__main__":
    main()
