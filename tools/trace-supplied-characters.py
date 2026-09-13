"""Trace individual source poses to real paths, preserving original source files.

Build dependencies: vtracer==0.6.15, Pillow==11.3.0.
These are traced review derivatives, not newly drawn high-resolution masters.
"""
import argparse
import hashlib
import json
from pathlib import Path
import tempfile
import xml.etree.ElementTree as ET
from PIL import Image
import vtracer

parser = argparse.ArgumentParser()
parser.add_argument('--character', choices=['leon', 'zaya', 'elephant'], required=True)
parser.add_argument('--state', choices=['empty', 'low', 'calm', 'happy', 'excited'])
args = parser.parse_args()
registry = json.loads(Path('data/character-review.json').read_text())
character = next(c for c in registry['characters'] if c['id'] == args.character)
out = Path('assets/character-review/vectors') / args.character
out.mkdir(parents=True, exist_ok=True)
for state, record in character['states'].items():
    if args.state and state != args.state:
        continue
    source = Path(record['source'])
    original = Image.open(source).convert('RGBA')
    # Ignore almost-invisible alpha dust; preserve all visible source colours.
    alpha = original.getchannel('A').point(lambda value: 255 if value >= 32 else 0)
    original.putalpha(alpha)
    target = out / (state + '.svg')
    with tempfile.TemporaryDirectory() as temporary:
        prepared = Path(temporary) / 'input.png'
        original.save(prepared)
        vtracer.convert_image_to_svg_py(str(prepared), str(target), colormode='color',
            hierarchical='stacked', mode='spline', filter_speckle=4,
            color_precision=8, layer_difference=4, corner_threshold=60,
            length_threshold=4, max_iterations=10, splice_threshold=45, path_precision=2)
    tree = ET.parse(target)
    svg = tree.getroot()
    namespace = 'http://www.w3.org/2000/svg'
    ET.register_namespace('', namespace)
    svg.set('viewBox', f'0 0 {original.width} {original.height}')
    svg.set('role', 'img')
    title = ET.Element(f'{{{namespace}}}title')
    title.text = f'{character["name"]}, {state}'
    svg.insert(0, title)
    assert not svg.findall(f'.//{{{namespace}}}image'), 'Raster embedding is forbidden'
    tree.write(target, encoding='unicode', xml_declaration=True)
    metadata = {
        'character': args.character, 'state': state, 'status': 'review-only',
        'source': str(source), 'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
        'sourceDimensions': list(original.size), 'method': 'vtracer-0.6.15-spline-paths',
        'svg': str(target), 'svgSha256': hashlib.sha256(target.read_bytes()).hexdigest(),
        'pathCount': len(svg.findall(f'.//{{{namespace}}}path')),
        'rasterEmbeddings': 0, 'productionApproved': False
    }
    target.with_suffix('.json').write_text(json.dumps(metadata, indent=2) + '\n')
    print(f'{args.character}/{state}: {metadata["pathCount"]} paths, {target.stat().st_size} bytes', flush=True)
