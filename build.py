import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PROJECTS_DIR = ROOT / "projects"
OUTPUT = ROOT / "projects.json"

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"}
VIDEO_EXT = {".mp4", ".webm", ".ogg", ".mov"}

DEFAULTS = {
    "title": "Proyecto sin título",
    "tagline": "",
    "year": "",
    "role": "",
    "genre": "",
    "tech": [],
    "featured": False,
    "github": "",
    "play": "",
    "description": "",
    "achievements": [],
    "learnings": "",
    "comments": "",
    "youtube": [],
}


def natural_key(name):
    parts = re.split(r"(\d+)", name)
    return [int(p) if p.isdigit() else p.lower() for p in parts]


def build_media(folder):
    media = []
    files = sorted(
        [f for f in folder.iterdir() if f.is_file()],
        key=lambda f: natural_key(f.name),
    )
    for f in files:
        ext = f.suffix.lower()
        rel = f"projects/{folder.name}/{f.name}"
        if ext in IMAGE_EXT:
            media.append({"type": "image", "src": rel})
        elif ext in VIDEO_EXT:
            media.append({"type": "video", "src": rel})
    return media


def extract_youtube_id(value):
    if not value:
        return ""
    value = value.strip()
    if "youtu" not in value and "/" not in value and "=" not in value:
        return value
    for sep in ["v=", "youtu.be/", "embed/", "shorts/"]:
        if sep in value:
            tail = value.split(sep, 1)[1]
            return tail.split("&")[0].split("?")[0].split("/")[0]
    return value


def load_project(folder):
    info_path = folder / "info.json"
    data = dict(DEFAULTS)
    if info_path.exists():
        try:
            with open(info_path, "r", encoding="utf-8") as fh:
                user = json.load(fh)
            for k, v in user.items():
                data[k] = v
        except json.JSONDecodeError as e:
            print(f"  ⚠  {folder.name}/info.json tiene un error de sintaxis: {e}")
    else:
        print(f"  ⚠  {folder.name} no tiene info.json")

    media = build_media(folder)
    for yt in data.get("youtube", []) or []:
        vid = extract_youtube_id(yt)
        if vid:
            media.append({"type": "youtube", "src": vid})

    data["media"] = media
    data["folder"] = folder.name
    data["id"] = folder.name
    return data


def main():
    if not PROJECTS_DIR.exists():
        print("No existe la carpeta projects/.")
        return

    folders = sorted(
        [d for d in PROJECTS_DIR.iterdir() if d.is_dir()],
        key=lambda d: natural_key(d.name),
    )
    projects = [load_project(f) for f in folders]
    projects.sort(key=lambda p: (not p.get("featured", False), natural_key(p["folder"])))

    with open(OUTPUT, "w", encoding="utf-8") as fh:
        json.dump(projects, fh, ensure_ascii=False, indent=2)

    print(f"✓ {len(projects)} proyecto(s) escritos en {OUTPUT.name}")
    for p in projects:
        star = "★" if p.get("featured") else " "
        n_img = sum(1 for m in p["media"] if m["type"] == "image")
        n_vid = sum(1 for m in p["media"] if m["type"] in ("video", "youtube"))
        print(f"  {star} {p['title']:<22} {n_img} img · {n_vid} video")


if __name__ == "__main__":
    main()
