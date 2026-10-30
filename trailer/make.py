"""Cuts the recorded frames (trailer/rec.js) and title cards (trailer/cards.js) into the trailer with ffmpeg.
Usage: python trailer/make.py <frames dir> <cards dir> <out.mp4>"""
import os, subprocess, sys, tempfile

FRAMES, CARDS, OUT = sys.argv[1:4]
FPS = 30
MUSIC, MUSIC_AT = 'audio/music/fantasy_orchestral_theme.mp3', 101.5  # CC0, Joth: the build and climax of the theme

# (shot, first frame, last frame, card overlaid at the bottom or None). A shot of None is a full-screen card for `last` frames.
EDIT = [
    (None, 0, 75, 'open'),
    ('fire', 0, 119, None),
    ('frost', 12, 99, 'elements'),
    ('storm', 20, 104, None),
    ('water', 10, 94, None),
    ('earth', 0, 89, None),
    ('ult_gravity', 2, 50, 'ults'),
    ('ult_cosmic', 2, 44, None),
    ('ult_light', 2, 44, None),
    ('ult_blades', 2, 44, None),
    ('ult_plasma', 2, 44, None),
    ('ult_ink', 2, 50, None),
    ('boss', 10, 119, 'bosses'),
    ('duel', 15, 149, 'duel'),
    ('dungeon', 6, 149, 'dungeon'),
    ('city', 0, 129, 'city'),
    (None, 0, 150, 'logo'),
]

def run(*a): subprocess.run(['ffmpeg', '-v', 'error', '-y', *a], check=True)

tmp = tempfile.mkdtemp()
parts = []
for i, (shot, a, b, card) in enumerate(EDIT):
    out = os.path.join(tmp, f'{i:02d}.mp4'); parts.append(out)
    enc = ['-frames:v', str(b if shot is None else b - a + 1), '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-pix_fmt', 'yuv420p', '-r', str(FPS), out]
    if shot is None:  # full-screen card, faded in and out
        d = b / FPS
        run('-loop', '1', '-t', str(d), '-i', os.path.join(CARDS, card + '.png'),
            '-vf', f'format=rgba,fade=in:st=0:d=0.6,fade=out:st={d - .7:.2f}:d=0.7,format=yuv420p', *enc)
        continue
    n = b - a + 1; d = n / FPS
    src = ['-framerate', str(FPS), '-start_number', str(a), '-i', os.path.join(FRAMES, shot, '%04d.jpg')]
    if card:
        run(*src, '-loop', '1', '-t', str(d), '-i', os.path.join(CARDS, card + '.png'), '-filter_complex',
            f'[1:v]format=rgba,fade=in:st=0.15:d=0.4:alpha=1,fade=out:st={min(2.6, d - .6):.2f}:d=0.45:alpha=1[c];[0:v][c]overlay=shortest=1', *enc)
    else:
        run(*src, *enc)

lst = os.path.join(tmp, 'list.txt')
open(lst, 'w').write(''.join(f"file '{p}'\n" for p in parts))
video = os.path.join(tmp, 'video.mp4')
run('-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', video)
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video], capture_output=True, text=True).stdout)
run('-i', video, '-ss', str(MUSIC_AT), '-t', str(dur), '-i', MUSIC,
    '-af', f'afade=in:st=0:d=1.5,afade=out:st={dur - 3}:d=3', '-map', '0:v', '-map', '1:a',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', OUT)
print(f'{OUT}: {dur:.1f} s')
