#!/usr/bin/env python3
"""
PWA用のアイコン画像を生成するスクリプト
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import math
except ImportError:
    print("Error: Pillow ライブラリが必要です")
    print("インストール: pip install Pillow")
    exit(1)

def create_hexagon_icon(size):
    """六角形をモチーフにしたアイコンを生成"""
    # 画像作成
    img = Image.new('RGB', (size, size), color='#667eea')
    draw = ImageDraw.Draw(img)

    # 中央の六角形を描画
    center_x, center_y = size // 2, size // 2
    hex_radius = size // 3

    # 六角形の頂点を計算
    points = []
    for i in range(6):
        angle = math.pi / 3 * i - math.pi / 6
        x = center_x + hex_radius * math.cos(angle)
        y = center_y + hex_radius * math.sin(angle)
        points.append((x, y))

    # 六角形の枠線を描画
    draw.polygon(points, outline='white', fill=None, width=size // 25)

    # 小さな六角形を3つ描画
    small_radius = size // 15
    positions = [
        (center_x, center_y - hex_radius // 3),  # 上
        (center_x - hex_radius // 3, center_y + hex_radius // 6),  # 左下
        (center_x + hex_radius // 3, center_y + hex_radius // 6),  # 右下
    ]

    for pos_x, pos_y in positions:
        small_points = []
        for i in range(6):
            angle = math.pi / 3 * i - math.pi / 6
            x = pos_x + small_radius * math.cos(angle)
            y = pos_y + small_radius * math.sin(angle)
            small_points.append((x, y))
        draw.polygon(small_points, fill='white', outline=None)

    return img

# 192x192のアイコンを生成
icon_192 = create_hexagon_icon(192)
icon_192.save('icons/icon-192.png')
print('✓ icons/icon-192.png を生成しました')

# 512x512のアイコンを生成
icon_512 = create_hexagon_icon(512)
icon_512.save('icons/icon-512.png')
print('✓ icons/icon-512.png を生成しました')

print('\nアイコン生成完了！')
