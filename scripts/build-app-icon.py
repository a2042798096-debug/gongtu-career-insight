from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets"
OUT.mkdir(exist_ok=True)

scale = 4
size = 512
canvas = size * scale
img = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

def box(coords, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(tuple(v * scale for v in coords), radius=radius * scale, fill=fill, outline=outline, width=width * scale)

box((16, 16, 496, 496), 116, "#101B1C")
box((42, 42, 470, 470), 92, "#142526", outline="#2E4542", width=3)

# Rising career bars.
bars = [
    (116, 290, 178, 386, 22),
    (225, 218, 287, 386, 22),
    (334, 132, 396, 386, 22),
]
for left, top, right, bottom, radius in bars:
    box((left, top, right, bottom), radius, "#C7F36B")

# Career route: three nodes linked by an upward path.
path = [(143, 258), (256, 174), (365, 101)]
draw.line([(x * scale, y * scale) for x, y in path], fill="#37C9C2", width=13 * scale, joint="curve")
for x, y in path:
    draw.ellipse(((x - 17) * scale, (y - 17) * scale, (x + 17) * scale, (y + 17) * scale), fill="#101B1C", outline="#37C9C2", width=8 * scale)

# Ground line gives the mark stability at small sizes.
draw.rounded_rectangle((90 * scale, 402 * scale, 422 * scale, 424 * scale), radius=11 * scale, fill="#6B817B")

img = img.resize((size, size), Image.Resampling.LANCZOS)
img.save(OUT / "icon.png")
img.save(OUT / "icon.ico", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
print(f"Generated {OUT / 'icon.png'} and {OUT / 'icon.ico'}")
