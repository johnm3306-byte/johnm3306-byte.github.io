"""Bundle the site into self-contained preview files.

Writes portfolio-preview.html (main page) and rates-preview.html (rate card),
each with CSS, JS and images inlined and linking to each other, so they work
anywhere without the rest of the folder. Run: python3 build.py
"""
import base64, mimetypes, pathlib, re

root = pathlib.Path(__file__).parent
PAGES = {"index.html": "portfolio-preview.html", "rates.html": "rates-preview.html"}

def inline_img(match):
    path = root / match.group(2)
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    data = base64.b64encode(path.read_bytes()).decode()
    return f'{match.group(1)}="data:{mime};base64,{data}"'

for src, dest in PAGES.items():
    html = (root / src).read_text()
    html = re.sub(r'<link rel="stylesheet" href="([\w.-]+\.css)">',
                  lambda m: f"<style>\n{(root / m.group(1)).read_text()}\n</style>", html)
    html = re.sub(r'<script src="([\w.-]+\.js)"></script>',
                  lambda m: f"<script>\n{(root / m.group(1)).read_text()}\n</script>", html)
    html = re.sub(r'(src|content|href)="(assets/[^"]+\.(?:svg|png|jpe?g))"', inline_img, html)
    for page, preview in PAGES.items():   # point page links at the preview files
        html = re.sub(rf'href="{re.escape(page)}(#[^"]*)?"', lambda m: f'href="{preview}{m.group(1) or ""}"', html)
    out = root / dest
    out.write_text(html)
    print(f"Wrote {out} ({out.stat().st_size // 1024} KB)")
