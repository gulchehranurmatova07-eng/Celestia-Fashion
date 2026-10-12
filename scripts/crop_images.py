"""
Builds the storefront imagery from the art-directed lookbook sheets in assets/source.

Each sheet combines a full-length model photograph (left) with a flat-lay of the
outfit (right). This script cuts them into:
  public/images/products/<key>.jpg   3:4 product shots (flat-lays, details, on-model crops)
  public/images/looks/<n>.jpg        full-length model photographs
  public/images/editorial/*.jpg      campaign crops used on the homepage

Run with:  python3 scripts/crop_images.py   (requires Pillow)
"""
from pathlib import Path
from PIL import Image, ImageFilter, ImageStat

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "source"
OUT = ROOT / "public" / "images"
W, H = 900, 1200  # 3:4 product frame
MAX_UPSCALE = 2.4
FLAT_MAX_UPSCALE = 3.6


def load(n):
    return Image.open(SRC / f"{n}.jpg").convert("RGB")


def bg_color(region):
    w, h = region.size
    strips = [region.crop((0, 0, w, 4)), region.crop((0, h - 4, w, h)),
              region.crop((0, 0, 4, h)), region.crop((w - 4, 0, w, h))]
    meds = [ImageStat.Stat(s).median for s in strips]
    return tuple(sorted(m[i] for m in meds)[1] for i in range(3))


def flat(img, box, fill=0.78):
    """Isolate an item on a seamless 3:4 canvas of its own background colour."""
    x0, y0, x1, y1 = box
    m = int(max(x1 - x0, y1 - y0) * 0.02)
    x0, y0 = max(0, x0 - m), max(0, y0 - m)
    x1, y1 = min(img.width, x1 + m), min(img.height, y1 + m)
    region = img.crop((x0, y0, x1, y1))
    color = bg_color(region)
    rw, rh = region.size
    scale = min(W * fill / rw, H * fill / rh, FLAT_MAX_UPSCALE)
    region = region.resize((max(1, int(rw * scale)), max(1, int(rh * scale))), Image.LANCZOS)
    rw, rh = region.size
    canvas = Image.new("RGB", (W, H), color)
    mask = Image.new("L", (rw, rh), 0)
    feather = max(4, int(min(rw, rh) * 0.05))
    inner = Image.new("L", (max(1, rw - 2 * feather), max(1, rh - 2 * feather)), 255)
    mask.paste(inner, (feather, feather))
    mask = mask.filter(ImageFilter.GaussianBlur(feather / 2))
    canvas.paste(region, ((W - rw) // 2, (H - rh) // 2), mask)
    return canvas


def cover(img, box):
    """Crop the largest 3:4 window centred in box (used for detail panels & scenes)."""
    x0, y0, x1, y1 = box
    bw, bh = x1 - x0, y1 - y0
    if bw / bh > 3 / 4:
        nw = int(bh * 3 / 4)
        x0 += (bw - nw) // 2
        x1 = x0 + nw
    else:
        nh = int(bw * 4 / 3)
        y0 += (bh - nh) // 2
        y1 = y0 + nh
    crop = img.crop((x0, y0, x1, y1))
    scale = min(W / crop.width, MAX_UPSCALE)
    return crop.resize((int(crop.width * scale), int(crop.width * scale * 4 / 3)), Image.LANCZOS)


def portrait(img, x0, y0, w):
    """3:4 crop of the model photograph starting at (x0, y0) with width w."""
    return cover(img, (x0, y0, x0 + w, min(img.height, y0 + int(w * 4 / 3))))


def save(im, path, q=86):
    path.parent.mkdir(parents=True, exist_ok=True)
    im = im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=40, threshold=2))
    im.save(path, "JPEG", quality=q, optimize=True, progressive=True)


# (sheet, mode, args)
PRODUCTS = {
    # Tailoring
    "ivory-db-blazer-1": (1, "cover", (0, 30, 700, 963)),
    "ivory-db-blazer-2": (1, "flat", (255, 1020, 410, 1215)),
    "ivory-db-blazer-3": (1, "cover", (565, 988, 718, 1238)),
    "ivory-db-blazer-4": (1, "flat", (0, 990, 238, 1536)),
    "taupe-db-blazer-1": (3, "flat", (470, 90, 815, 595)),
    "taupe-db-blazer-2": (3, "portrait", (0, 20, 455)),
    "black-gold-blazer-1": (4, "flat", (500, 110, 800, 540)),
    "black-gold-blazer-2": (4, "portrait", (20, 20, 450)),
    "black-gold-blazer-3": (4, "cover", (826, 572, 1038, 744)),
    "charcoal-blazer-1": (8, "flat", (500, 110, 800, 540)),
    "charcoal-blazer-2": (8, "portrait", (20, 20, 450)),
    "charcoal-blazer-3": (8, "cover", (826, 572, 1038, 744)),
    "sand-blazer-1": (6, "flat", (468, 85, 788, 530)),
    "sand-blazer-2": (6, "portrait", (0, 20, 448)),
    "sand-blazer-3": (6, "cover", (636, 902, 768, 1168)),
    "oatmeal-blazer-1": (7, "flat", (455, 65, 775, 500)),
    "oatmeal-blazer-2": (7, "portrait", (0, 0, 450)),
    "oatmeal-blazer-3": (7, "cover", (487, 924, 600, 1186)),
    # Outerwear
    "suede-jacket-1": (12, "flat", (505, 55, 965, 595)),
    "suede-jacket-2": (12, "portrait", (0, 0, 470)),
    "leather-jacket-1": (16, "flat", (493, 180, 792, 548)),
    "leather-jacket-2": (16, "portrait", (0, 60, 485)),
    "leather-jacket-3": (16, "cover", (1030, 357, 1200, 586)),
    "denim-jacket-1": (11, "flat", (515, 165, 800, 508)),
    "denim-jacket-2": (11, "portrait", (0, 60, 497)),
    "denim-jacket-3": (11, "cover", (1044, 382, 1199, 643)),
    # Knitwear
    "cardigan-1": (13, "flat", (485, 80, 825, 535)),
    "cardigan-2": (13, "portrait", (0, 30, 455)),
    "cardigan-3": (13, "cover", (496, 994, 633, 1203)),
    "turtleneck-taupe-1": (3, "flat", (820, 100, 1120, 592)),
    "turtleneck-taupe-2": (3, "portrait", (0, 20, 455)),
    "turtleneck-ivory-1": (14, "flat", (470, 90, 845, 578)),
    "turtleneck-ivory-2": (14, "portrait", (0, 0, 450)),
    # Shirts
    "poplin-white-1": (9, "flat", (485, 50, 865, 548)),
    "poplin-white-2": (9, "portrait", (0, 0, 458)),
    "poplin-white-3": (9, "cover", (499, 926, 656, 1196)),
    "poplin-white-4": (9, "cover", (676, 926, 818, 1196)),
    "poplin-black-1": (10, "flat", (485, 45, 860, 545)),
    "poplin-black-2": (10, "portrait", (0, 0, 455)),
    "poplin-black-3": (10, "cover", (482, 912, 636, 1176)),
    "poplin-burgundy-1": (15, "flat", (485, 45, 860, 548)),
    "poplin-burgundy-2": (15, "portrait", (0, 0, 455)),
    "poplin-burgundy-3": (15, "cover", (482, 912, 636, 1176)),
    "poplin-burgundy-4": (15, "cover", (650, 912, 788, 1176)),
    "twill-navy-1": (2, "flat", (495, 45, 865, 550)),
    "twill-navy-2": (2, "portrait", (0, 0, 465)),
    "twill-navy-3": (2, "cover", (507, 926, 664, 1196)),
    "twill-navy-4": (2, "cover", (684, 926, 821, 1196)),
    "stripe-shirt-1": (4, "flat", (808, 145, 1058, 530)),
    "stripe-shirt-2": (4, "cover", (826, 769, 1038, 942)),
    "stripe-shirt-3": (8, "portrait", (20, 20, 450)),
    "tee-white-1": (11, "flat", (802, 225, 1035, 508)),
    "tee-white-2": (16, "flat", (772, 240, 1016, 548)),
    "tee-white-3": (16, "portrait", (0, 60, 485)),
    # Trousers & denim
    "chinos-ivory-1": (2, "flat", (885, 65, 1172, 830)),
    "chinos-ivory-2": (2, "portrait", (0, 560, 465)),
    "chinos-ivory-3": (2, "cover", (839, 926, 1004, 1196)),
    "chinos-chocolate-1": (9, "flat", (885, 70, 1172, 825)),
    "chinos-chocolate-2": (7, "portrait", (0, 560, 450)),
    "chinos-chocolate-3": (7, "cover", (882, 924, 1028, 1186)),
    "tailored-black-1": (10, "flat", (900, 70, 1172, 832)),
    "tailored-black-2": (10, "portrait", (0, 560, 455)),
    "tailored-black-3": (6, "flat", (990, 108, 1195, 840)),
    "tailored-white-1": (14, "flat", (880, 95, 1160, 815)),
    "tailored-white-2": (14, "portrait", (0, 560, 450)),
    "pleated-cream-1": (3, "flat", (485, 615, 768, 1072)),
    "pleated-cream-2": (3, "portrait", (0, 600, 455)),
    "pleated-black-1": (13, "flat", (898, 495, 1122, 975)),
    "pleated-black-2": (13, "portrait", (0, 560, 455)),
    "charcoal-trousers-1": (8, "flat", (530, 570, 750, 1200)),
    "charcoal-trousers-2": (8, "portrait", (0, 640, 480)),
    "jeans-white-1": (11, "flat", (530, 575, 775, 1137)),
    "jeans-white-2": (11, "portrait", (0, 560, 497)),
    "jeans-black-1": (16, "flat", (515, 570, 762, 1152)),
    "jeans-black-2": (16, "portrait", (0, 520, 485)),
    "jeans-black-3": (16, "cover", (1030, 592, 1200, 816)),
    # Shoes
    "sneakers-1": (14, "flat", (495, 860, 820, 1172)),
    "sneakers-2": (11, "flat", (825, 908, 1000, 1128)),
    "sneakers-4": (2, "portrait", (0, 675, 465)),
    "oxfords-1": (10, "flat", (510, 595, 825, 860)),
    "oxfords-2": (4, "flat", (825, 1100, 1020, 1368)),
    "oxfords-3": (6, "cover", (934, 902, 1050, 1168)),
    "oxfords-4": (10, "portrait", (0, 675, 455)),
    "loafers-1": (3, "flat", (740, 895, 945, 1165)),
    "loafers-2": (12, "flat", (555, 958, 770, 1248)),
    "loafers-3": (3, "portrait", (0, 760, 455)),
    # Accessories
    "belt-1": (3, "flat", (762, 662, 960, 738)),
    "belt-2": (4, "flat", (815, 993, 1048, 1068)),
    "pocket-square-1": (3, "flat", (950, 668, 1120, 880)),
    "tie-1": (13, "flat", (1112, 88, 1188, 460)),
    "tie-2": (13, "cover", (784, 994, 900, 1203)),
    "sunglasses-1": (14, "flat", (638, 722, 858, 808)),
    "sunglasses-2": (14, "portrait", (0, 0, 450)),
    "sunglasses-3": (11, "flat", (838, 598, 1000, 668)),
    "watch-steel-1": (10, "flat", (1072, 910, 1195, 1180)),
    "watch-steel-2": (15, "portrait", (0, 0, 455)),
    "watch-strap-1": (16, "flat", (856, 728, 928, 868)),
    "watch-strap-2": (16, "cover", (1030, 822, 1200, 990)),
    "watch-strap-3": (12, "flat", (555, 632, 635, 900)),
    "necklace-1": (14, "flat", (495, 640, 615, 812)),
    "necklace-2": (14, "portrait", (0, 0, 450)),
}

# Full-length model panels from each sheet.
LOOKS = {1: (0, 990, 238, 1536), 2: (0, 0, 465, 1295), 3: (0, 0, 455, 1374), 4: (0, 0, 480, 1448),
         6: (0, 0, 448, 1295), 7: (0, 0, 450, 1295), 8: (0, 0, 480, 1448), 9: (0, 0, 458, 1295),
         10: (0, 0, 455, 1295), 11: (0, 0, 497, 1280), 12: (0, 0, 470, 1280), 13: (0, 0, 455, 1295),
         14: (0, 0, 450, 1295), 15: (0, 0, 455, 1295), 16: (0, 0, 485, 1280)}

EDITORIAL = {
    "hero-seated": (1, (0, 0, 700, 985)),
    "portrait-face": (1, (705, 0, 1024, 355)),
    "portrait-profile": (1, (705, 695, 1024, 985)),
    "portrait-back": (1, (705, 360, 1024, 690)),
}


def main():
    sheets = {}
    for key, (n, mode, args) in PRODUCTS.items():
        img = sheets.setdefault(n, load(n))
        if mode == "flat":
            im = flat(img, args)
        elif mode == "cover":
            im = cover(img, args)
        else:
            im = portrait(img, *args)
        save(im, OUT / "products" / f"{key}.jpg")
    for n, box in LOOKS.items():
        img = sheets.setdefault(n, load(n))
        save(img.crop(box), OUT / "looks" / f"look-{n}.jpg", q=88)
    for name, (n, box) in EDITORIAL.items():
        img = sheets.setdefault(n, load(n))
        save(img.crop(box), OUT / "editorial" / f"{name}.jpg", q=88)
    logo = Image.open(SRC / "logo.webp").convert("RGB")
    save(logo, ROOT / "public" / "brand" / "celestia-logo.jpg", q=92)
    print(f"{len(PRODUCTS)} product images, {len(LOOKS)} looks, {len(EDITORIAL)} editorial crops")


if __name__ == "__main__":
    main()
