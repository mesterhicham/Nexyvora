import base64
import os
from PIL import Image

ICON_SOURCE = 'C:/Users/hp/.gemini/antigravity/brain/86f382df-81fd-408a-9850-2749cf360ef5/.user_uploaded/media_1790898920264.png'
LOGO_SOURCE = 'C:/Users/hp/.gemini/antigravity/brain/86f382df-81fd-408a-9850-2749cf360ef5/.user_uploaded/media_1790898913107.png'

os.makedirs('public/icons', exist_ok=True)

# 1. Prepare cropped icon
raw_icon = Image.open(ICON_SOURCE)
icon_bbox = (168, 94, 753, 452)
cropped_icon = raw_icon.crop(icon_bbox).convert('RGBA')
iw, ih = cropped_icon.size

def create_square_transparent(size, content_fill=0.90):
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    target_w = int(size * content_fill)
    target_h = int(ih * (target_w / iw))
    if target_h > int(size * content_fill):
        target_h = int(size * content_fill)
        target_w = int(iw * (target_h / ih))
    resized = cropped_icon.resize((target_w, target_h), Image.Resampling.LANCZOS)
    ox = (size - target_w) // 2
    oy = (size - target_h) // 2
    canvas.paste(resized, (ox, oy), resized)
    return canvas

def create_square_maskable(size, bg_color=(15, 23, 42, 255), content_fill=0.72):
    canvas = Image.new('RGBA', (size, size), bg_color)
    target_w = int(size * content_fill)
    target_h = int(ih * (target_w / iw))
    resized = cropped_icon.resize((target_w, target_h), Image.Resampling.LANCZOS)
    ox = (size - target_w) // 2
    oy = (size - target_h) // 2
    canvas.paste(resized, (ox, oy), resized)
    return canvas

# 2. Generate PWA standard icons
print("Generating PWA standard icons...")
icon_512 = create_square_transparent(512, 0.90)
icon_512.save('public/icons/icon-512x512.png')
icon_512.save('public/logo-icon.png')

icon_192 = create_square_transparent(192, 0.90)
icon_192.save('public/icons/icon-192x192.png')

# 3. Generate PWA maskable icons
print("Generating PWA maskable icons...")
maskable_512 = create_square_maskable(512, (15, 23, 42, 255), 0.72)
maskable_512.save('public/icons/icon-maskable-512x512.png')

maskable_192 = create_square_maskable(192, (15, 23, 42, 255), 0.72)
maskable_192.save('public/icons/icon-maskable-192x192.png')

# 4. Generate Apple Touch Icon (180x180)
print("Generating Apple Touch Icon...")
apple_touch = create_square_maskable(180, (15, 23, 42, 255), 0.75)
apple_touch.save('public/icons/apple-touch-icon.png')

# 5. Generate Favicons (32x32, 64x64, favicon.ico)
print("Generating Favicons...")
fav_32 = create_square_transparent(32, 0.95)
fav_32.save('public/icons/favicon-32x32.png')

fav_64 = create_square_transparent(64, 0.95)
fav_64.save('public/icons/favicon-64x64.png')

fav_ico_base = create_square_transparent(256, 0.95)
fav_ico_base.save('public/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])

# 6. Generate SVG icon (public/icons/icon.svg and public/logo-icon.svg)
print("Generating SVG icons...")
with open('public/icons/icon-512x512.png', 'rb') as f:
    b64_png = base64.b64encode(f.read()).decode('utf-8')

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image width="512" height="512" href="data:image/png;base64,{b64_png}" />
</svg>
'''

with open('public/icons/icon.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)
with open('public/logo-icon.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)

# 7. Generate horizontal logos (Dark, Light, Universal)
print("Generating Horizontal Logos...")
raw_logo = Image.open(LOGO_SOURCE)
logo_bbox = (10, 117, 1019, 361)
cropped_logo = raw_logo.crop(logo_bbox).convert('RGBA')
cropped_logo.save('public/logo-dark.png')
cropped_logo.save('public/logo.png')

# Light mode version with dark slate letters for 'exy' and tagline
lw, lh = cropped_logo.size
light_logo = cropped_logo.copy()
lpix = light_logo.load()
for y in range(lh):
    for x in range(350, lw):
        if y < 55 or (x < 400 and y < 65):
            continue
        r, g, b, a = lpix[x, y]
        if a > 20:
            diff = max(abs(r - g), abs(r - b), abs(g - b))
            if diff < 40 and r > 160 and g > 160 and b > 160:
                lpix[x, y] = (15, 23, 42, a)

light_logo.save('public/logo-light.png')

# 8. Generate OpenGraph Preview Image (1200x630)
print("Generating OpenGraph image...")
og_img = Image.new('RGBA', (1200, 630), (11, 17, 32, 255))
target_og_w = 700
target_og_h = int(lh * (target_og_w / lw))
resized_og_logo = cropped_logo.resize((target_og_w, target_og_h), Image.Resampling.LANCZOS)
og_ox = (1200 - target_og_w) // 2
og_oy = (630 - target_og_h) // 2
og_img.paste(resized_og_logo, (og_ox, og_oy), resized_og_logo)
og_img.save('public/og-image.png')

print("ALL ASSETS SUCCESSFULLY GENERATED!")
