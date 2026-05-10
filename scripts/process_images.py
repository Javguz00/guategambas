from pathlib import Path
import json
import re
from PIL import Image, ImageChops, ImageOps

SOURCE = Path(r"D:/FOTOS PRODUCTOS")
DEST_ROOT = Path(r"d:/Proyectos/GuateGambas/public/photos")
MANIFEST = Path(r"d:/Proyectos/GuateGambas/data/imported_product_photos.json")

MAPPING = [
    (r"blody mary|bloody mary", "bloody-mary"),
    (r"green jade", "green-jade"),
    (r"golden bee", "golden-bee"),
    (r"tibee", "tai-bee-spotted-head"),
    (r"\bcrs\b", "crs"),
    (r"\bcbs\b", "taiwan-cbs"),
    (r"cherr", "cherries"),
    (r"black", "black-neocaridina"),
    (r"bacter ae", "bacter-ae"),
    (r"magic powder", "magic-powder"),
    (r"cholla|troncos de cholla", "tronco-cholla"),
    (r"hojas de almendro", "almendro-hojas-10"),
    (r"filtro", "filtro-pulmon-material"),
    (r"sobo", "bomba-sobo"),
    (r"fluval stratum|sustrato fluval", "fluval-stratum"),
    (r"shrim sand|shrimp sand", "shrimp-sand"),
    (r"wanenergy\s*28", "wanenergy-30"),
    (r"wanenergy\s*58|wanenergy\s*60", "wanenergy-60"),
    (r"alimento", "salty-shrimp-gh"),
]
IGNORE = [r"envios a todo el pais"]


def slug_for(name: str):
    text = name.lower()
    for pat in IGNORE:
        if re.search(pat, text):
            return None
    for pat, slug in MAPPING:
        if re.search(pat, text):
            return slug
    return "__UNMAPPED__"


def safe_name(stem: str):
    text = stem.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    return text or "image"


def auto_crop(img: Image.Image):
    w, h = img.size
    corners = [img.getpixel((0, 0)), img.getpixel((w - 1, 0)), img.getpixel((0, h - 1)), img.getpixel((w - 1, h - 1))]
    bg = tuple(int(sum(ch) / 4) for ch in zip(*corners))
    bg_img = Image.new("RGB", img.size, bg)
    diff = ImageChops.difference(img, bg_img)
    bbox = diff.getbbox()
    if not bbox:
        return img, False
    margin = max(8, int(min(w, h) * 0.01))
    left = max(0, bbox[0] - margin)
    top = max(0, bbox[1] - margin)
    right = min(w, bbox[2] + margin)
    bottom = min(h, bbox[3] + margin)
    cw = right - left
    ch = bottom - top
    if cw * ch >= w * h * 0.98:
        return img, False
    return img.crop((left, top, right, bottom)), True


manifest = {}
unmapped = []
processed = []

for path in sorted(SOURCE.iterdir()):
    if not path.is_file() or path.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
        continue
    slug = slug_for(path.stem)
    if slug is None:
        continue
    if slug == "__UNMAPPED__":
        unmapped.append(path.name)
        continue

    out_dir = DEST_ROOT / slug
    out_dir.mkdir(parents=True, exist_ok=True)

    base = safe_name(path.stem)
    out_path = out_dir / f"{base}.jpg"

    img = Image.open(path)
    img = ImageOps.exif_transpose(img).convert("RGB")
    final_img, cropped = auto_crop(img)
    final_img.save(out_path, format="JPEG", quality=92, optimize=True)

    web_path = f"/photos/{slug}/{out_path.name}"
    manifest.setdefault(slug, []).append(web_path)
    processed.append({"source": path.name, "target": web_path, "cropped": cropped, "size": final_img.size})

for slug, items in manifest.items():
    seen = set()
    deduped = []
    for item in items:
        if item not in seen:
            seen.add(item)
            deduped.append(item)
    manifest[slug] = deduped

MANIFEST.parent.mkdir(parents=True, exist_ok=True)
MANIFEST.write_text(json.dumps({"manifest": manifest, "processed": processed, "unmapped": unmapped}, indent=2), encoding="utf-8")

print(f"Processed: {len(processed)}")
print(f"Unmapped: {len(unmapped)}")
for name in unmapped:
    print(f" - {name}")
