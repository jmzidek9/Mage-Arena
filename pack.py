"""Pack the whole game into ONE file, index.html: open it to play, send it to a friend and they double-click it.
Everything goes inside: three.js, PeerJS, the game scripts, and the Blender models (gzip-compressed, base64).
Run from this folder:  python pack.py
"""
import base64, gzip, os

HERE = os.path.dirname(os.path.abspath(__file__))
read = lambda p: open(os.path.join(HERE, p), encoding='utf-8').read()
html = read('src/index.html')  # the page template


def swap(tag, new):
    global html
    assert html.count(tag) == 1, tag
    html = html.replace(tag, new)


swap('<script src="js/vendor/three.min.js"></script>', '<script>' + read('js/vendor/three.min.js') + '</script>')
swap('<script src="js/vendor/peerjs.min.js"></script>', '<script>' + read('js/vendor/peerjs.min.js') + '</script>')
models = {n[:-4]: base64.b64encode(gzip.compress(open(os.path.join(HERE, 'assets', n), 'rb').read(), 9)).decode()
          for n in sorted(os.listdir(os.path.join(HERE, 'assets'))) if n.endswith('.glb')}
swap('<script src="assets/models.js"></script>',
     '<script>' + read('js/vendor/gunzip.min.js') + '</script>\n<script>window.MAGE_ASSETS_GZ = {'
     + ','.join(f'"{k}":"{v}"' for k, v in models.items()) + '};</script>')
# game code rides along as inert text; the boot script runs it in order
game = ''.join(f'<script type="text/x-mage" data-src="js/{f}">{read("js/" + f)}</script>\n'
               for f in ('core.js', 'elements.js', 'sim.js', 'modes.js', 'dungeon.js', 'view.js', 'net.js'))
boot = '<script>\n// Boot:'
swap(boot, game + boot)
assert '</script' not in ''.join(read('js/' + f) for f in ('core.js', 'elements.js', 'sim.js', 'modes.js', 'dungeon.js', 'view.js', 'net.js'))
out = os.path.join(HERE, 'index.html')
open(out, 'w', encoding='utf-8').write(html)
print('wrote index.html', round(os.path.getsize(out) / 1e6, 1), 'MB')
