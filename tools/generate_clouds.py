"""Procedural cumulus strips (RGBA WebP) that tile seamlessly left↔right.

Clouds are built from soft elliptical puffs; every puff is also stamped at x±W so
the strip wraps. Edge erosion uses FFT noise, which is periodic by construction.
"""
import numpy as np
from PIL import Image, ImageFilter

OUT = str(__import__("pathlib").Path(__file__).resolve().parent.parent / "assets" / "img")
BONE = np.array([243, 238, 231], float)
LIT = np.array([253, 253, 252], float)
SHADOW = np.array([178, 195, 218], float)


def fbm(w, h, beta, seed):
    rng = np.random.default_rng(seed)
    kx = np.fft.fftfreq(w)[None, :] * w
    ky = np.fft.fftfreq(h)[:, None] * h
    f = np.sqrt(kx ** 2 + ky ** 2); f[0, 0] = 1
    amp = 1 / f ** (beta / 2); amp[0, 0] = 0
    amp[f < 6] = 0                                      # no giant blotches, only texture
    n = np.real(np.fft.ifft2(amp * np.exp(1j * rng.uniform(0, 2 * np.pi, (h, w)))))
    lo, hi = np.percentile(n, [1, 99])
    return np.clip((n - lo) / (hi - lo), 0, 1)


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def stamp(acc, cx, cy, rx, ry, weight=1.0):
    h, w = acc.shape
    y0, y1 = int(max(0, cy - 2.2 * ry)), int(min(h, cy + 2.2 * ry))
    if y1 <= y0:
        return
    for ox in (-w, 0, w):
        x0, x1 = int(max(0, cx + ox - 2.2 * rx)), int(min(w, cx + ox + 2.2 * rx))
        if x1 <= x0:
            continue
        yy = (np.arange(y0, y1)[:, None] - cy) / ry
        xx = (np.arange(x0, x1)[None, :] - (cx + ox)) / rx
        acc[y0:y1, x0:x1] += weight * np.exp(-(xx ** 2 + yy ** 2) * 1.6)


def cumulus(acc, rng, cx, base, width, height, puffs):
    """One cloud: flat-ish base, domed top built from many puffs."""
    for _ in range(puffs):
        u = rng.normal(0, 0.33)                          # position across the cloud
        x = cx + u * width
        dome = max(0.0, 1 - (2 * u) ** 2)                # taller in the middle
        top = base - height * (0.35 + 0.65 * dome)
        y = rng.uniform(top, base)
        r = rng.uniform(0.09, 0.26) * height * (0.6 + 0.6 * dome)
        stamp(acc, x, y, r * rng.uniform(1.0, 1.4), r, 0.55)


def render(name, acc, seed, bone_top=0.0, alpha_max=1.0, base_cut=None, shade_k=1.0):
    h, w = acc.shape
    y = np.linspace(0, 1, h)[:, None]
    dens = 1 - np.exp(-acc * 0.95)                       # soft saturation
    if base_cut is not None:                             # flatten cloud bases
        dens *= base_cut
    erode = fbm(w, h, 1.9, seed)
    dens = np.clip((dens - 0.42 * (1 - erode) - 0.04) * 1.9, 0, 1)
    dens = smooth(0, 1, dens)
    a = np.asarray(Image.fromarray((dens * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)), float) / 255

    # Self-shadowing: mass above a pixel darkens it; tops stay sunlit.
    blur = np.asarray(Image.fromarray((dens * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(14)), float) / 255
    above = np.roll(blur, 26, axis=0); above[:26] = blur[:1]
    occl = np.clip((above * 0.7 + blur * 0.4) - 0.45, 0, 1)
    # each puff is sunlit on its crown and shadowed underneath: sign of d(acc)/dy
    lit = np.log1p(acc)
    grad = lit - np.roll(lit, 9, axis=0)                  # >0 where mass increases downward = crown
    tex = fbm(w, h, 2.4, seed + 5)
    shade = np.clip(0.34 - grad * 2.2 + occl * 0.6 + (tex - 0.5) * 0.22, 0, 1)
    shade = np.asarray(Image.fromarray((shade * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2)), float)[..., None] / 255
    shade = shade * shade_k
    rgb = LIT * (1 - shade) + SHADOW * shade
    if bone_top:
        wash = (1 - smooth(0, bone_top, y))[..., None]
        rgb = rgb * (1 - wash) + BONE * wash
    img = np.dstack([np.clip(rgb, 0, 255), np.clip(a * alpha_max, 0, 1) * 255]).astype(np.uint8)
    Image.fromarray(img, "RGBA").save(f"{OUT}/{name}.webp", quality=84, method=6)
    print(name, img.shape)


W = 2400

# Front bank — solid along the top edge (so it melts out of the limewash page), with
# heavy cumulus lobes hanging beneath it.
rng = np.random.default_rng(3)
H = 760
acc = np.zeros((H, W))
for x in np.linspace(0, W, 18, endpoint=False):
    stamp(acc, x + rng.uniform(-40, 40), rng.uniform(-40, 60), rng.uniform(200, 300), rng.uniform(150, 220), 1.1)
for x in np.linspace(0, W, 11, endpoint=False):
    cx = x + rng.uniform(-60, 60)
    for _ in range(24):
        u = rng.normal(0, 0.35)
        stamp(acc, cx + u * 260, rng.uniform(140, 440) * (1 - 0.45 * abs(u)), rng.uniform(45, 105) * 1.2, rng.uniform(45, 105), 0.7)
render("clouds-front", acc, 11, bone_top=0.3, shade_k=0.5)

# Mid — separate cumulus with flat bases, the classic fair-weather sky.
rng = np.random.default_rng(8)
H = 560
acc = np.zeros((H, W))
for x in np.linspace(0, W, 6, endpoint=False):
    base = rng.uniform(380, 460)
    cumulus(acc, rng, x + rng.uniform(-90, 90), base, rng.uniform(260, 420), rng.uniform(170, 260), 110)
yy = np.arange(H)[:, None]
render("clouds-mid", acc, 23, alpha_max=0.97, base_cut=1 - smooth(440, 500, yy))

# Low — flattened, distant puffs that sit along the horizon and hide the photo seam.
rng = np.random.default_rng(15)
H = 380
acc = np.zeros((H, W))
for x in np.linspace(0, W, 13, endpoint=False):
    cx = x + rng.uniform(-50, 50)
    for _ in range(16):
        u = rng.normal(0, 0.4)
        stamp(acc, cx + u * 150, rng.uniform(170, 290) - 60 * max(0, 1 - (2 * u) ** 2), rng.uniform(40, 90) * 1.9, rng.uniform(26, 55), 0.7)
render("clouds-low", acc, 37, alpha_max=0.95, base_cut=1 - smooth(290, 330, yy[:H]))
