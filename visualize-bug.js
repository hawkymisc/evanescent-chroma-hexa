// 六角形配置のバグを視覚化するSVG生成

const fs = require('fs');

const cssWidth = 60;
const cssHeight = 70;
const size = 35;

// 配置関数
function hexToPixel(q, r) {
    const x = size * Math.sqrt(3) * (q + 0.5 * (r % 2));
    const y = size * 1.5 * r;
    return { x, y };
}

// CSS clip-pathの頂点 (相対座標)
function getHexagonPath(offsetX, offsetY) {
    const points = [
        { x: offsetX + cssWidth * 0.5, y: offsetY + cssHeight * 0 },      // 上
        { x: offsetX + cssWidth * 1.0, y: offsetY + cssHeight * 0.25 },   // 右上
        { x: offsetX + cssWidth * 1.0, y: offsetY + cssHeight * 0.75 },   // 右下
        { x: offsetX + cssWidth * 0.5, y: offsetY + cssHeight * 1.0 },    // 下
        { x: offsetX + cssWidth * 0, y: offsetY + cssHeight * 0.75 },     // 左下
        { x: offsetX + cssWidth * 0, y: offsetY + cssHeight * 0.25 }      // 左上
    ];

    return points.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
}

// SVGの生成
let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .hex { fill: none; stroke: #333; stroke-width: 1; }
      .hex-current { fill: rgba(255, 107, 107, 0.5); }
      .hex-adjacent { fill: rgba(78, 205, 196, 0.5); }
      .gap-highlight { fill: red; opacity: 0.7; }
      .vertex { fill: black; }
      .label { font-family: Arial; font-size: 12px; }
      .gap-label { font-family: Arial; font-size: 14px; fill: red; font-weight: bold; }
    </style>
  </defs>

  <!-- タイトル -->
  <text x="400" y="30" text-anchor="middle" class="label" style="font-size: 18px; font-weight: bold;">
    六角形配置のバグ: 0.62px の隙間
  </text>

  <g transform="translate(100, 80)">
`;

// ケース1: 水平隣接 (0,0) と (1,0)
const pos00 = hexToPixel(0, 0);
const pos10 = hexToPixel(1, 0);

svg += `    <!-- 水平隣接のケース -->
    <text x="150" y="-10" text-anchor="middle" class="label" style="font-weight: bold;">
      ケース1: 水平隣接 (0,0) と (1,0)
    </text>

    <!-- 六角形 (0,0) -->
    <polygon points="${getHexagonPath(pos00.x, pos00.y)}" class="hex hex-current" />
    <text x="${pos00.x + 30}" y="${pos00.y + 38}" text-anchor="middle" class="label">(0,0)</text>

    <!-- 六角形 (1,0) -->
    <polygon points="${getHexagonPath(pos10.x, pos10.y)}" class="hex hex-adjacent" />
    <text x="${pos10.x + 30}" y="${pos10.y + 38}" text-anchor="middle" class="label">(1,0)</text>

    <!-- 隙間を強調 -->
    <rect x="${pos00.x + cssWidth}" y="${pos00.y + cssHeight * 0.25}"
          width="${(pos10.x - pos00.x - cssWidth).toFixed(2)}"
          height="${cssHeight * 0.5}"
          class="gap-highlight" />

    <!-- 隙間のラベル -->
    <text x="${(pos00.x + cssWidth + pos10.x) / 2}" y="${pos00.y + 35}"
          text-anchor="middle" class="gap-label">
      0.62px
    </text>

    <!-- 右辺と左辺を強調 -->
    <line x1="${pos00.x + cssWidth}" y1="${pos00.y + cssHeight * 0.25}"
          x2="${pos00.x + cssWidth}" y2="${pos00.y + cssHeight * 0.75}"
          stroke="red" stroke-width="3" />
    <line x1="${pos10.x}" y1="${pos10.y + cssHeight * 0.25}"
          x2="${pos10.x}" y2="${pos10.y + cssHeight * 0.75}"
          stroke="blue" stroke-width="3" />

    <!-- 寸法線 -->
    <line x1="${pos00.x + cssWidth}" y1="${pos00.y - 10}"
          x2="${pos10.x}" y2="${pos10.y - 10}"
          stroke="black" stroke-width="1" marker-end="url(#arrowhead)" />
    <line x1="${pos00.x + cssWidth}" y1="${pos00.y - 15}"
          x2="${pos00.x + cssWidth}" y2="${pos00.y - 5}"
          stroke="black" stroke-width="1" />
    <line x1="${pos10.x}" y1="${pos10.y - 15}"
          x2="${pos10.x}" y2="${pos10.y - 5}"
          stroke="black" stroke-width="1" />
`;

// ケース2: 斜め隣接 (0,0) と (0,1)
const pos01 = hexToPixel(0, 1);

svg += `
    <!-- 斜め隣接のケース -->
    <g transform="translate(350, 0)">
      <text x="150" y="-10" text-anchor="middle" class="label" style="font-weight: bold;">
        ケース2: 斜め隣接 (0,0) と (0,1)
      </text>

      <!-- 六角形 (0,0) -->
      <polygon points="${getHexagonPath(pos00.x, pos00.y)}" class="hex hex-current" />
      <text x="${pos00.x + 30}" y="${pos00.y + 38}" text-anchor="middle" class="label">(0,0)</text>

      <!-- 六角形 (0,1) -->
      <polygon points="${getHexagonPath(pos01.x, pos01.y)}" class="hex hex-adjacent" />
      <text x="${pos01.x + 30}" y="${pos01.y + 38}" text-anchor="middle" class="label">(0,1)</text>

      <!-- 頂点を強調 -->
      <circle cx="${pos00.x + cssWidth * 0.5}" cy="${pos00.y + cssHeight}" r="3" class="vertex" />
      <circle cx="${pos00.x + cssWidth}" cy="${pos00.y + cssHeight * 0.75}" r="3" class="vertex" />
      <circle cx="${pos01.x + cssWidth * 0.5}" cy="${pos01.y}" r="3" class="vertex" />
      <circle cx="${pos01.x}" cy="${pos01.y + cssHeight * 0.25}" r="3" class="vertex" />

      <!-- 頂点間の距離を示す線 -->
      <line x1="${pos00.x + cssWidth * 0.5}" y1="${pos00.y + cssHeight}"
            x2="${pos01.x + cssWidth * 0.5}" y2="${pos01.y}"
            stroke="red" stroke-width="2" stroke-dasharray="5,5" />
      <text x="${(pos00.x + pos01.x + cssWidth * 0.5) / 2 + 10}"
            y="${(pos00.y + cssHeight + pos01.y) / 2}"
            class="gap-label" style="font-size: 12px;">
        35.00px
      </text>

      <line x1="${pos00.x + cssWidth}" y1="${pos00.y + cssHeight * 0.75}"
            x2="${pos01.x}" y2="${pos01.y + cssHeight * 0.25}"
            stroke="blue" stroke-width="2" stroke-dasharray="5,5" />
      <text x="${(pos00.x + cssWidth + pos01.x) / 2 + 10}"
            y="${(pos00.y + cssHeight * 0.75 + pos01.y + cssHeight * 0.25) / 2}"
            class="gap-label" style="font-size: 12px;">
        34.46px
      </text>
    </g>
`;

svg += `  </g>

  <!-- 説明 -->
  <g transform="translate(50, 350)">
    <text x="0" y="0" class="label" style="font-weight: bold;">バグの原因:</text>
    <text x="0" y="20" class="label">• CSS width = 60px だが、理論的には √3 × 35 ≈ 60.62px であるべき</text>
    <text x="0" y="40" class="label">• 配置計算は正しく 60.62px の間隔を使用しているため、0.62px の隙間が生じる</text>
  </g>
</svg>`;

// ファイルに保存
fs.writeFileSync('/home/user/evanescent-chroma-hexa/bug-visualization.svg', svg);
console.log("✅ SVG画像を生成しました: bug-visualization.svg");
console.log("\nこのSVGファイルをブラウザで開くと、バグを視覚的に確認できます。");
