// 隣接する六角形の辺の接触状況を詳細検証

console.log("=== 六角形の辺の接触状況の詳細検証 ===\n");

// CSS定義
const cssWidth = 60;
const cssHeight = 70;
const size = 35;

// CSS clip-pathで定義された頂点 (width=60, height=70 のボックス内)
const vertices = {
    top: { x: cssWidth * 0.5, y: cssHeight * 0 },      // (30, 0)
    topRight: { x: cssWidth * 1.0, y: cssHeight * 0.25 },  // (60, 17.5)
    bottomRight: { x: cssWidth * 1.0, y: cssHeight * 0.75 },  // (60, 52.5)
    bottom: { x: cssWidth * 0.5, y: cssHeight * 1.0 },    // (30, 70)
    bottomLeft: { x: cssWidth * 0, y: cssHeight * 0.75 },  // (0, 52.5)
    topLeft: { x: cssWidth * 0, y: cssHeight * 0.25 }   // (0, 17.5)
};

console.log("CSS clip-path で定義された六角形の頂点:");
console.log(`  上:     (${vertices.top.x}, ${vertices.top.y})`);
console.log(`  右上:   (${vertices.topRight.x}, ${vertices.topRight.y})`);
console.log(`  右下:   (${vertices.bottomRight.x}, ${vertices.bottomRight.y})`);
console.log(`  下:     (${vertices.bottom.x}, ${vertices.bottom.y})`);
console.log(`  左下:   (${vertices.bottomLeft.x}, ${vertices.bottomLeft.y})`);
console.log(`  左上:   (${vertices.topLeft.x}, ${vertices.topLeft.y})\n`);

// 配置関数
function hexToPixel(q, r) {
    const x = size * Math.sqrt(3) * (q + 0.5 * (r % 2));
    const y = size * 1.5 * r;
    return { x, y };
}

// 六角形の絶対座標での頂点を計算
function getAbsoluteVertices(q, r, offsetX = 0, offsetY = 0) {
    const pos = hexToPixel(q, r);
    const absX = pos.x + offsetX;
    const absY = pos.y + offsetY;

    return {
        top: { x: absX + vertices.top.x, y: absY + vertices.top.y },
        topRight: { x: absX + vertices.topRight.x, y: absY + vertices.topRight.y },
        bottomRight: { x: absX + vertices.bottomRight.x, y: absY + vertices.bottomRight.y },
        bottom: { x: absX + vertices.bottom.x, y: absY + vertices.bottom.y },
        bottomLeft: { x: absX + vertices.bottomLeft.x, y: absY + vertices.bottomLeft.y },
        topLeft: { x: absX + vertices.topLeft.x, y: absY + vertices.topLeft.y }
    };
}

console.log("=== ケース1: 同じ行の水平隣接 (0,0) と (1,0) ===\n");

const hex00 = getAbsoluteVertices(0, 0);
const hex10 = getAbsoluteVertices(1, 0);

console.log("六角形 (0,0) の右側の辺:");
console.log(`  右上頂点: (${hex00.topRight.x.toFixed(2)}, ${hex00.topRight.y.toFixed(2)})`);
console.log(`  右下頂点: (${hex00.bottomRight.x.toFixed(2)}, ${hex00.bottomRight.y.toFixed(2)})`);

console.log("\n六角形 (1,0) の左側の辺:");
console.log(`  左上頂点: (${hex10.topLeft.x.toFixed(2)}, ${hex10.topLeft.y.toFixed(2)})`);
console.log(`  左下頂点: (${hex10.bottomLeft.x.toFixed(2)}, ${hex10.bottomLeft.y.toFixed(2)})`);

const rightEdgeX00 = hex00.topRight.x;
const leftEdgeX10 = hex10.topLeft.x;
const horizontalGap = leftEdgeX10 - rightEdgeX00;

console.log(`\n辺の間隔:`);
console.log(`  (1,0)の左辺X座標 - (0,0)の右辺X座標`);
console.log(`  = ${leftEdgeX10.toFixed(2)} - ${rightEdgeX00.toFixed(2)}`);
console.log(`  = ${horizontalGap.toFixed(2)}px\n`);

if (Math.abs(horizontalGap) < 0.01) {
    console.log(`✅ 水平隣接: 辺が完全に接触しています (誤差 ${Math.abs(horizontalGap).toFixed(4)}px)`);
} else if (horizontalGap > 0) {
    console.log(`❌ 水平隣接: 辺の間に ${horizontalGap.toFixed(2)}px の隙間があります`);
} else {
    console.log(`❌ 水平隣接: 辺が ${Math.abs(horizontalGap).toFixed(2)}px 重なっています`);
}

console.log("\n" + "=".repeat(60) + "\n");

console.log("=== ケース2: 偶数行から奇数行への斜め隣接 (0,0) と (0,1) ===\n");

const hex01 = getAbsoluteVertices(0, 1);

console.log("六角形 (0,0) の右下の辺:");
console.log(`  下頂点:   (${hex00.bottom.x.toFixed(2)}, ${hex00.bottom.y.toFixed(2)})`);
console.log(`  右下頂点: (${hex00.bottomRight.x.toFixed(2)}, ${hex00.bottomRight.y.toFixed(2)})`);

console.log("\n六角形 (0,1) の左上の辺:");
console.log(`  上頂点:   (${hex01.top.x.toFixed(2)}, ${hex01.top.y.toFixed(2)})`);
console.log(`  左上頂点: (${hex01.topLeft.x.toFixed(2)}, ${hex01.topLeft.y.toFixed(2)})`);

// 辺の中点を計算して比較
const edge00BottomRightMid = {
    x: (hex00.bottom.x + hex00.bottomRight.x) / 2,
    y: (hex00.bottom.y + hex00.bottomRight.y) / 2
};

const edge01TopLeftMid = {
    x: (hex01.top.x + hex01.topLeft.x) / 2,
    y: (hex01.top.y + hex01.topLeft.y) / 2
};

console.log(`\n辺の中点:`);
console.log(`  (0,0)の右下辺中点: (${edge00BottomRightMid.x.toFixed(2)}, ${edge00BottomRightMid.y.toFixed(2)})`);
console.log(`  (0,1)の左上辺中点: (${edge01TopLeftMid.x.toFixed(2)}, ${edge01TopLeftMid.y.toFixed(2)})`);

// 頂点同士の距離を確認
const dist_bottom_to_top = Math.sqrt(
    Math.pow(hex01.top.x - hex00.bottom.x, 2) +
    Math.pow(hex01.top.y - hex00.bottom.y, 2)
);

const dist_bottomRight_to_topLeft = Math.sqrt(
    Math.pow(hex01.topLeft.x - hex00.bottomRight.x, 2) +
    Math.pow(hex01.topLeft.y - hex00.bottomRight.y, 2)
);

console.log(`\n頂点間の距離:`);
console.log(`  (0,0)の下頂点 → (0,1)の上頂点: ${dist_bottom_to_top.toFixed(2)}px`);
console.log(`  (0,0)の右下頂点 → (0,1)の左上頂点: ${dist_bottomRight_to_topLeft.toFixed(2)}px`);

// 理論的には、隣接する六角形の辺は完全に重なるべき
// つまり、頂点間の距離は0であるべき
if (dist_bottom_to_top < 0.01 && dist_bottomRight_to_topLeft < 0.01) {
    console.log(`\n✅ 斜め隣接: 辺が完全に接触しています`);
} else {
    console.log(`\n❌ 斜め隣接: 辺が接触していません`);
    console.log(`   頂点間に距離があります`);
}

console.log("\n" + "=".repeat(60) + "\n");

console.log("=== ケース3: 奇数行の水平隣接 (0,1) と (1,1) ===\n");

const hex11 = getAbsoluteVertices(1, 1);

console.log("六角形 (0,1) の右側の辺:");
console.log(`  右上頂点: (${hex01.topRight.x.toFixed(2)}, ${hex01.topRight.y.toFixed(2)})`);
console.log(`  右下頂点: (${hex01.bottomRight.x.toFixed(2)}, ${hex01.bottomRight.y.toFixed(2)})`);

console.log("\n六角形 (1,1) の左側の辺:");
console.log(`  左上頂点: (${hex11.topLeft.x.toFixed(2)}, ${hex11.topLeft.y.toFixed(2)})`);
console.log(`  左下頂点: (${hex11.bottomLeft.x.toFixed(2)}, ${hex11.bottomLeft.y.toFixed(2)})`);

const rightEdgeX01 = hex01.topRight.x;
const leftEdgeX11 = hex11.topLeft.x;
const horizontalGap2 = leftEdgeX11 - rightEdgeX01;

console.log(`\n辺の間隔:`);
console.log(`  (1,1)の左辺X座標 - (0,1)の右辺X座標`);
console.log(`  = ${leftEdgeX11.toFixed(2)} - ${rightEdgeX01.toFixed(2)}`);
console.log(`  = ${horizontalGap2.toFixed(2)}px\n`);

if (Math.abs(horizontalGap2) < 0.01) {
    console.log(`✅ 水平隣接: 辺が完全に接触しています (誤差 ${Math.abs(horizontalGap2).toFixed(4)}px)`);
} else if (horizontalGap2 > 0) {
    console.log(`❌ 水平隣接: 辺の間に ${horizontalGap2.toFixed(2)}px の隙間があります`);
} else {
    console.log(`❌ 水平隣接: 辺が ${Math.abs(horizontalGap2).toFixed(2)}px 重なっています`);
}

console.log("\n" + "=".repeat(60) + "\n");

// 理論的な正しい値の計算
console.log("=== 理論的に正しい値の提案 ===\n");

console.log("オプション1: CSSの width を理論値に合わせる");
const correctWidth = size * Math.sqrt(3);
console.log(`  width: ${cssWidth}px → ${correctWidth.toFixed(2)}px`);
console.log(`  変更量: +${(correctWidth - cssWidth).toFixed(2)}px\n`);

console.log("オプション2: size を CSS width に合わせる");
const correctSize = cssWidth / Math.sqrt(3);
console.log(`  size: ${size}px → ${correctSize.toFixed(2)}px`);
console.log(`  変更量: ${(correctSize - size).toFixed(2)}px`);
console.log(`  ただし、この場合 height も変更が必要:`);
console.log(`  height: ${cssHeight}px → ${(correctSize * 2).toFixed(2)}px\n`);

console.log("推奨: オプション1を採用");
console.log("  理由: size=35 は CSS clip-path の垂直辺の長さと一致しており、");
console.log("       この値を変更すると clip-path の定義も変更が必要になる。");
console.log("       width のみを調整する方が変更範囲が小さい。");
