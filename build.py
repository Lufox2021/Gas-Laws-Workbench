# python3 build.py  -> writes index.html from src/
import pathlib
s = pathlib.Path('src')
t = (s/'template.html').read_text()
for tag, f in [('/*CSS*/','style.css'),('/*ENGINE*/','engine.js'),('/*PROBLEMS*/','problems.js'),('/*UI*/','ui.js')]:
    t = t.replace(tag, (s/f).read_text())
pathlib.Path('index.html').write_text(t)
print('index.html', len(t), 'bytes')
