"""Build a dependency-free GitHub Pages site from the collection and original files."""
import json
import hashlib
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'dist'
OUT.mkdir(exist_ok=True)
for filename in ('index.html', 'styles.css', 'app.js'):
    shutil.copy2(ROOT / filename, OUT / filename)
# Refresh browser caches whenever the stylesheet or application changes.
html = (OUT / 'index.html').read_text()
for filename in ('styles.css', 'app.js'):
    version = hashlib.sha256((OUT / filename).read_bytes()).hexdigest()[:12]
    html = html.replace(f'"{filename}"', f'"{filename}?v={version}"')
(OUT / 'index.html').write_text(html)
shutil.copytree(ROOT / 'assets', OUT / 'assets', dirs_exist_ok=True)
collection = json.loads((ROOT / 'collection.json').read_text())
for jersey in collection:
    text = (ROOT / jersey['textFile']).read_bytes()
    encoding = 'utf-16' if text.startswith((b'\xff\xfe', b'\xfe\xff')) else 'utf-8-sig'
    jersey['description'] = text.decode(encoding).strip()
    for image in jersey['images']:
        target = OUT / image
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / image, target)
(OUT / 'collection.json').write_text(json.dumps(collection, ensure_ascii=False))
(OUT / '.nojekyll').touch()
print(f'Built {len(collection)} jerseys and {sum(len(j["images"]) for j in collection)} original photos in {OUT}')
