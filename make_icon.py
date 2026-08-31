from pathlib import Path
from PIL import Image

# The repository PNG is the single source for the app, tray and taskbar icon.
source = Path("assets/app-icon.png")
ico_path = Path("build/icon.ico")

if not source.is_file():
    raise SystemExit(f"missing app icon source: {source}")

ico_path.parent.mkdir(parents=True, exist_ok=True)

image = Image.open(source).convert("RGBA")
if image.width != image.height:
    raise SystemExit(f"app icon must be square, got {image.size}")

image.save(
    ico_path,
    format="ICO",
    sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
)
print(f"wrote {ico_path} from {source} ({image.width}x{image.height} RGBA)")
