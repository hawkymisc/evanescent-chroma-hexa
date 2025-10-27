// 六角形の幾何学的検証スクリプト

console.log("=== Pointy-top六角形の幾何学的検証 ===\n");

// CSS定義の値
const cssWidth = 60;
const cssHeight = 70;
console.log(`CSS定義:`);
console.log(`  width: ${cssWidth}px`);
console.log(`  height: ${cssHeight}px\n`);

// コードで定義されている値
const edgeLength = 35;
console.log(`コードで定義された一辺の長さ (size):`);
console.log(`  size: ${edgeLength}px\n`);

// Pointy-top六角形の理論的な寸法
console.log("Pointy-top六角形の理論値:");
console.log(`  一辺の長さを s とすると:`);
console.log(`  - 高さ = 2 * s`);
console.log(`  - 横幅 = √3 * s`);
console.log(`  - 行間隔 = 1.5 * s (高さの3/4)\n`);

// sizeから計算される理論値
const theoreticalWidth = Math.sqrt(3) * edgeLength;
const theoreticalHeight = 2 * edgeLength;
console.log(`size=${edgeLength}px から計算される理論値:`);
console.log(`  横幅 = √3 * ${edgeLength} = ${theoreticalWidth.toFixed(2)}px`);
console.log(`  高さ = 2 * ${edgeLength} = ${theoreticalHeight}px\n`);

// CSS定義から逆算されるsize
const sizeFromHeight = cssHeight / 2;
const sizeFromWidth = cssWidth / Math.sqrt(3);
console.log(`CSS定義から逆算される size:`);
console.log(`  height=${cssHeight}px → size = ${cssHeight}/2 = ${sizeFromHeight}px`);
console.log(`  width=${cssWidth}px → size = ${cssWidth}/√3 = ${sizeFromWidth.toFixed(2)}px\n`);

// 不整合の検出
console.log("=== 不整合の検出 ===");
const widthDiff = theoreticalWidth - cssWidth;
const heightDiff = theoreticalHeight - cssHeight;
console.log(`横幅の差: ${theoreticalWidth.toFixed(2)} - ${cssWidth} = ${widthDiff.toFixed(2)}px`);
console.log(`高さの差: ${theoreticalHeight} - ${cssHeight} = ${heightDiff}px\n`);

if (Math.abs(widthDiff) > 0.1) {
    console.log(`❌ 警告: 横幅に${widthDiff.toFixed(2)}pxの不整合があります！`);
    console.log(`   理論値: ${theoreticalWidth.toFixed(2)}px`);
    console.log(`   CSS値:  ${cssWidth}px\n`);
}
if (Math.abs(heightDiff) > 0.1) {
    console.log(`❌ 警告: 高さに${heightDiff}pxの不整合があります！`);
    console.log(`   理論値: ${theoreticalHeight}px`);
    console.log(`   CSS値:  ${cssHeight}px\n`);
}

// 配置計算の検証
console.log("=== 配置計算の検証 ===");
const size = edgeLength;

// even-r offset座標系の配置式
function hexToPixel(q, r) {
    const x = size * Math.sqrt(3) * (q + 0.5 * (r % 2));
    const y = size * 1.5 * r;
    return { x, y };
}

// いくつかのタイルの配置を計算
console.log("タイルの配置計算 (オフセット前):");
for (let r = 0; r < 3; r++) {
    console.log(`\n行 ${r} (${r % 2 === 0 ? '偶数' : '奇数'}):`);
    for (let q = 0; q < 3; q++) {
        const pos = hexToPixel(q, r);
        console.log(`  (q=${q}, r=${r}) → (x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(2)})`);
    }
}

// 隣接するタイル間の距離を計算
console.log("\n=== 隣接タイル間の距離 ===");

// 同じ行の隣接タイル (q=0,r=0 と q=1,r=0)
const pos00 = hexToPixel(0, 0);
const pos10 = hexToPixel(1, 0);
const horizontalDist = pos10.x - pos00.x;
console.log(`水平隣接 (0,0)→(1,0): ${horizontalDist.toFixed(2)}px`);
console.log(`  六角形の横幅: ${cssWidth}px`);
console.log(`  差: ${(horizontalDist - cssWidth).toFixed(2)}px`);

if (Math.abs(horizontalDist - cssWidth) > 1) {
    console.log(`\n❌ 致命的バグ: 水平方向の間隔(${horizontalDist.toFixed(2)}px)が`);
    console.log(`   六角形の横幅(${cssWidth}px)と一致しません！`);
    console.log(`   隣接する六角形の辺が${(horizontalDist - cssWidth).toFixed(2)}px離れています。\n`);
}

// 垂直隣接 (q=0,r=0 と q=0,r=1)
const pos01 = hexToPixel(0, 1);
const verticalDist = pos01.y - pos00.y;
console.log(`\n垂直隣接 (0,0)→(0,1): ${verticalDist.toFixed(2)}px`);
console.log(`  理論値 (1.5 * size): ${(1.5 * size).toFixed(2)}px`);

// 斜め隣接 (q=0,r=0 と q=0,r=1 の実際の距離は斜め方向)
// 偶数行から奇数行への右上/右下隣接を確認
const pos01RightTop = hexToPixel(0, 1); // (0,0)の右下隣接
console.log(`\n斜め隣接 (0,0)→(0,1):`);
console.log(`  X方向の差: ${(pos01.x - pos00.x).toFixed(2)}px`);
console.log(`  Y方向の差: ${(pos01.y - pos00.y).toFixed(2)}px`);

// CSS clip-pathの検証
console.log("\n=== CSS clip-path の検証 ===");
console.log(`clip-path: polygon(`);
console.log(`  50% 0%    → (${cssWidth*0.5}, ${cssHeight*0}) = (${cssWidth*0.5}, 0)`);
console.log(`  100% 25%  → (${cssWidth*1.0}, ${cssHeight*0.25}) = (${cssWidth}, ${cssHeight*0.25})`);
console.log(`  100% 75%  → (${cssWidth*1.0}, ${cssHeight*0.75}) = (${cssWidth}, ${cssHeight*0.75})`);
console.log(`  50% 100%  → (${cssWidth*0.5}, ${cssHeight*1.0}) = (${cssWidth*0.5}, ${cssHeight})`);
console.log(`  0% 75%    → (${cssWidth*0}, ${cssHeight*0.75}) = (0, ${cssHeight*0.75})`);
console.log(`  0% 25%    → (${cssWidth*0}, ${cssHeight*0.25}) = (0, ${cssHeight*0.25})`);
console.log(`)`);

const verticalEdgeLength = cssHeight * 0.75 - cssHeight * 0.25;
console.log(`\n垂直辺の長さ: ${cssHeight*0.75} - ${cssHeight*0.25} = ${verticalEdgeLength}px`);
console.log(`定義された size: ${edgeLength}px`);
console.log(`一致: ${verticalEdgeLength === edgeLength ? '✓' : '✗'}\n`);

// まとめ
console.log("=== 診断まとめ ===");
if (Math.abs(horizontalDist - cssWidth) > 1) {
    console.log(`\n🔴 バグ確認:`);
    console.log(`   六角形の横幅(${cssWidth}px)と配置間隔(${horizontalDist.toFixed(2)}px)が不一致`);
    console.log(`   → 隣接する六角形の辺が完全に接触していません`);
    console.log(`   → 隙間: ${(horizontalDist - cssWidth).toFixed(2)}px\n`);

    console.log(`修正方法の提案:`);
    console.log(`  オプション1: CSS width を ${theoreticalWidth.toFixed(2)}px に変更`);
    console.log(`  オプション2: size を ${sizeFromWidth.toFixed(2)}px に変更`);
} else {
    console.log(`✅ 配置は正しく、隣接する六角形の辺が接触しています`);
}
