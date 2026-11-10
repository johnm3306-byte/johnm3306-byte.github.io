"""Bundle the site into one self-contained HTML file (portfolio-preview.html).

Inlines styles.css, main.js and every local image, so the file works on its own:
open it in a browser, email it, or preview it anywhere. Run: python3 build.py
"""
import base64, mimetypes, pathlib, re

root = pathlib.Path(__file__).parent
html = (root / "index.html").read_text()
css = (root / "styles.css").read_text()
js = (root / "main.js").read_text()

html = html.replace('<link rel="stylesheet" href="styles.css">', f"<style>\n{css}\n</style>")
html = html.replace('<script src="main.js"></script>', f"<script>\n{js}\n</script>")

def inline(match):
    path = root / match.group(2)
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    data = base64.b64encode(path.read_bytes()).decode()
    return f'{match.group(1)}="data:{mime};base64,{data}"'

html = re.sub(r'(src|content)="(assets/[^"]+)"', inline, html)
out = root / "portfolio-preview.html"
out.write_text(html)
print(f"Wrote {out} ({out.stat().st_size // 1024} KB)")
