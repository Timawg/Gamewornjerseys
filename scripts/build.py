"""Build a dependency-free GitHub Pages site from the collection and original files."""
import json
import hashlib
import shutil
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'dist'
# Rebuild from scratch so removed source photos cannot remain in the deployment.
if OUT.exists():
    shutil.rmtree(OUT)
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
research = json.loads((ROOT / 'research' / 'sources.json').read_text())
english = json.loads((ROOT / 'translations' / 'en.json').read_text())
if set(english['jerseys']) != {jersey['id'] for jersey in collection}:
    raise ValueError('English descriptions must cover every jersey exactly once')
if set(english['sourceTitles']) != set(research['sources']):
    raise ValueError('English source labels must cover every historical source')
for text in [*english['jerseys'].values(), *english['sourceTitles'].values()]:
    if not isinstance(text, str) or not text.strip():
        raise ValueError('English translations must not be empty')
if set(research['jerseys']) - {jersey['id'] for jersey in collection}:
    raise ValueError('Historical sources reference an unknown jersey')
for jersey in collection:
    text = (ROOT / jersey['textFile']).read_bytes() if jersey.get('textFile') else b''
    encoding = 'utf-16' if text.startswith((b'\xff\xfe', b'\xfe\xff')) else 'utf-8-sig'
    jersey['description'] = text.decode(encoding).strip()
    jersey['descriptions'] = {
        'sv': jersey['description'],
        'en': english['jerseys'][jersey['id']].strip(),
    }
    source_ids = research['jerseys'].get(jersey['id'], [])
    if source_ids:
        jersey['researchSources'] = [
            {
                **research['sources'][key],
                'titles': {
                    'sv': research['sources'][key]['title'],
                    'en': english['sourceTitles'][key],
                },
            }
            for key in source_ids
        ]
        for source in jersey['researchSources']:
            url = urlsplit(source['url'])
            if url.scheme != 'https' or not url.netloc:
                raise ValueError('Historical source must use an HTTPS URL')
    jersey['imageVersions'] = {}
    for image in jersey['images']:
        target = OUT / image
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / image, target)
        jersey['imageVersions'][image] = hashlib.sha256(target.read_bytes()).hexdigest()[:12]
(OUT / 'collection.json').write_text(json.dumps(collection, ensure_ascii=False))
(OUT / '.nojekyll').touch()
print(f'Built {len(collection)} jerseys and {sum(len(j["images"]) for j in collection)} original photos in {OUT}')
