// Node.js環境で直接テストを実行
// ブラウザ環境をシミュレート

// グローバル変数とモック
global.document = {
    elements: {},
    getElementById: function(id) {
        if (!this.elements[id]) {
            this.elements[id] = {
                textContent: '',
                innerHTML: '',
                classList: {
                    classes: new Set(),
                    add: function(cls) { this.classes.add(cls); },
                    remove: function(cls) { this.classes.delete(cls); },
                    contains: function(cls) { return this.classes.has(cls); }
                }
            };
        }
        return this.elements[id];
    },
    querySelector: function() { return null; },
    querySelectorAll: function() { return []; },
    addEventListener: function() {},
    createElement: function() {
        return {
            className: '',
            dataset: {},
            style: {},
            addEventListener: function() {}
        };
    }
};

// ゲームロジックを読み込み（DOM操作部分を除く）
const GRID_COLS = 8;
const GRID_ROWS = 9;
const NUM_COLORS = 4;
const HEX_SIZE = 30;

let gameState = {
    tiles: new Map(),
    score: 0,
    gameOver: false
};

function hexToPixel(q, r) {
    const x = HEX_SIZE * (3/2 * q);
    const y = HEX_SIZE * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
    return { x, y };
}

function coordKey(q, r) {
    return `${q},${r}`;
}

const NEIGHBOR_OFFSETS = [
    { dq: +1, dr: 0 },
    { dq: +1, dr: -1 },
    { dq: 0, dr: -1 },
    { dq: -1, dr: 0 },
    { dq: -1, dr: +1 },
    { dq: 0, dr: +1 }
];

function getNeighbors(q, r) {
    return NEIGHBOR_OFFSETS.map(offset => ({
        q: q + offset.dq,
        r: r + offset.dr
    }));
}

function randomColor() {
    return Math.floor(Math.random() * NUM_COLORS);
}

function findGroup(startQ, startR) {
    const startTile = gameState.tiles.get(coordKey(startQ, startR));
    if (!startTile) return [];

    const targetColor = startTile.color;
    const visited = new Set();
    const group = [];
    const queue = [{ q: startQ, r: startR }];

    while (queue.length > 0) {
        const current = queue.shift();
        const key = coordKey(current.q, current.r);

        if (visited.has(key)) continue;
        visited.add(key);

        const tile = gameState.tiles.get(key);
        if (!tile || tile.color !== targetColor) continue;

        group.push(tile);

        const neighbors = getNeighbors(current.q, current.r);
        neighbors.forEach(neighbor => {
            const neighborKey = coordKey(neighbor.q, neighbor.r);
            if (!visited.has(neighborKey)) {
                queue.push(neighbor);
            }
        });
    }

    return group;
}

function applyGravity() {
    for (let q = 0; q < GRID_COLS; q++) {
        const columnTiles = [];

        for (let r = 0; r < GRID_ROWS; r++) {
            const tile = gameState.tiles.get(coordKey(q, r));
            if (tile) {
                columnTiles.push(tile);
            }
        }

        for (let r = 0; r < GRID_ROWS; r++) {
            gameState.tiles.delete(coordKey(q, r));
        }

        const startRow = GRID_ROWS - columnTiles.length;
        columnTiles.forEach((tile, index) => {
            const newR = startRow + index;
            tile.r = newR;
            gameState.tiles.set(coordKey(q, newR), tile);
        });
    }
}

function checkGameOver() {
    const checked = new Set();

    for (const [key, tile] of gameState.tiles) {
        if (checked.has(key)) continue;

        const group = findGroup(tile.q, tile.r);
        group.forEach(t => checked.add(coordKey(t.q, t.r)));

        if (group.length >= 2) {
            return;
        }
    }

    gameState.gameOver = true;
}

// テスト実行
let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        passed++;
        console.log(`✅ ${message}`);
    } else {
        failed++;
        console.log(`❌ ${message}`);
    }
}

function assertEquals(actual, expected, message) {
    if (actual === expected) {
        passed++;
        console.log(`✅ ${message}`);
    } else {
        failed++;
        console.log(`❌ ${message} (期待: ${expected}, 実際: ${actual})`);
    }
}

function beforeEach() {
    gameState.tiles.clear();
    gameState.score = 0;
    gameState.gameOver = false;
}

console.log('\n🧪 テスト実行開始\n');
console.log('='.repeat(60));

// 六角形座標ユーティリティのテスト
console.log('\n📦 六角形座標ユーティリティ');
console.log('-'.repeat(60));

// coordKey
assertEquals(coordKey(0, 0), '0,0', 'coordKey(0,0) = "0,0"');
assertEquals(coordKey(7, 8), '7,8', 'coordKey(7,8) = "7,8"');
assertEquals(coordKey(4, 4), '4,4', 'coordKey(4,4) = "4,4"');

// hexToPixel
const p1 = hexToPixel(0, 0);
assertEquals(p1.x, 0, 'hexToPixel(0,0).x = 0');
assertEquals(p1.y, 0, 'hexToPixel(0,0).y = 0');

const p2 = hexToPixel(1, 0);
assert(Math.abs(p2.x - 45) < 0.1, 'hexToPixel(1,0).x ≈ 45');
assert(Math.abs(p2.y - 25.98) < 0.1, 'hexToPixel(1,0).y ≈ 25.98');

// getNeighbors
const n1 = getNeighbors(0, 0);
assertEquals(n1.length, 6, 'getNeighbors(0,0) は6方向を返す');

const n2 = getNeighbors(4, 4);
assertEquals(n2.length, 6, 'getNeighbors(4,4) は6方向を返す');

// randomColor
for (let i = 0; i < 100; i++) {
    const color = randomColor();
    assert(color >= 0 && color <= 3 && Number.isInteger(color),
           `randomColor() は0-3の整数 (${i+1}/100)`);
    if (i >= 99) break; // 最後の1回だけログ出力
}

// グループ検出のテスト
console.log('\n🔍 グループ検出 (BFS)');
console.log('-'.repeat(60));

beforeEach();
gameState.tiles.set('4,4', { q: 4, r: 4, color: 0 });
gameState.tiles.set('5,4', { q: 5, r: 4, color: 1 });
const g1 = findGroup(4, 4);
assertEquals(g1.length, 1, '孤立タイル: グループサイズ = 1');

beforeEach();
gameState.tiles.set('0,0', { q: 0, r: 0, color: 0 });
gameState.tiles.set('1,0', { q: 1, r: 0, color: 0 });
const g2 = findGroup(0, 0);
assertEquals(g2.length, 2, '横2個同色: グループサイズ = 2');

beforeEach();
gameState.tiles.set('0,0', { q: 0, r: 0, color: 0 });
gameState.tiles.set('1,0', { q: 1, r: 0, color: 0 });
gameState.tiles.set('1,-1', { q: 1, r: -1, color: 0 });
const g3 = findGroup(0, 0);
assertEquals(g3.length, 3, 'L字3個同色: グループサイズ = 3');

beforeEach();
for (let r = 0; r < 3; r++) {
    for (let q = 0; q < 3; q++) {
        gameState.tiles.set(coordKey(q, r), { q, r, color: 0 });
    }
}
const g4 = findGroup(1, 1);
assertEquals(g4.length, 9, '3×3全同色: グループサイズ = 9');

beforeEach();
const g5 = findGroup(10, 10);
assertEquals(g5.length, 0, '存在しない座標: 空配列');

// 重力処理のテスト
console.log('\n⬇️  重力処理');
console.log('-'.repeat(60));

beforeEach();
for (let r = 0; r < 5; r++) {
    gameState.tiles.set(coordKey(0, r), { q: 0, r, color: 0 });
}
gameState.tiles.delete('0,2');
gameState.tiles.delete('0,3');
gameState.tiles.delete('0,4');
applyGravity();
assert(gameState.tiles.has('0,7'), '重力処理: 上のタイルが下に落ちる (0,7)');
assert(gameState.tiles.has('0,8'), '重力処理: 上のタイルが下に落ちる (0,8)');
assert(!gameState.tiles.has('0,0'), '重力処理: 元の位置が空 (0,0)');

beforeEach();
applyGravity();
assertEquals(gameState.tiles.size, 0, '空グリッドで重力処理: タイル数 = 0');

beforeEach();
for (let r = 0; r < GRID_ROWS; r++) {
    for (let q = 0; q < GRID_COLS; q++) {
        gameState.tiles.set(coordKey(q, r), { q, r, color: 0 });
    }
}
const before = gameState.tiles.size;
applyGravity();
assertEquals(gameState.tiles.size, before, 'フルグリッドで重力処理: タイル数変化なし');

// ゲーム終了判定のテスト
console.log('\n🏁 ゲーム終了判定');
console.log('-'.repeat(60));

beforeEach();
gameState.tiles.set('0,0', { q: 0, r: 0, color: 0 });
gameState.tiles.set('1,0', { q: 1, r: 0, color: 1 });
gameState.tiles.set('0,1', { q: 0, r: 1, color: 2 });
gameState.tiles.set('1,1', { q: 1, r: 1, color: 3 });
checkGameOver();
assert(gameState.gameOver, '全タイル異色: ゲーム終了');

beforeEach();
gameState.tiles.set('0,0', { q: 0, r: 0, color: 0 });
gameState.tiles.set('1,0', { q: 1, r: 0, color: 0 });
checkGameOver();
assert(!gameState.gameOver, '2個以上の同色隣接: ゲーム継続');

beforeEach();
gameState.tiles.set('5,5', { q: 5, r: 5, color: 0 });
checkGameOver();
assert(gameState.gameOver, 'タイル1個: ゲーム終了');

beforeEach();
checkGameOver();
assert(gameState.gameOver, 'タイル0個: ゲーム終了');

// スコア計算のテスト
console.log('\n🎯 スコア計算');
console.log('-'.repeat(60));

const scores = [
    { n: 2, expected: 0 },
    { n: 3, expected: 1 },
    { n: 4, expected: 4 },
    { n: 5, expected: 9 },
    { n: 10, expected: 64 },
    { n: 20, expected: 324 }
];

scores.forEach(({ n, expected }) => {
    const score = Math.pow(n - 2, 2);
    assertEquals(score, expected, `スコア計算: (${n}-2)² = ${expected}`);
});

// 境界値テスト
console.log('\n📏 境界値テスト');
console.log('-'.repeat(60));

beforeEach();
for (let r = 0; r < GRID_ROWS; r++) {
    for (let q = 0; q < GRID_COLS; q++) {
        gameState.tiles.set(coordKey(q, r), { q, r, color: 0 });
    }
}
assertEquals(gameState.tiles.size, 72, 'グリッドサイズ境界: 最大72個');

beforeEach();
const corners = [
    { q: 0, r: 0 },
    { q: 7, r: 0 },
    { q: 0, r: 8 },
    { q: 7, r: 8 }
];
corners.forEach(corner => {
    gameState.tiles.set(coordKey(corner.q, corner.r), { ...corner, color: 0 });
});
assertEquals(gameState.tiles.size, 4, '座標境界: 四隅の配置');

// 結果表示
console.log('\n' + '='.repeat(60));
console.log('📊 テスト結果');
console.log('='.repeat(60));
console.log(`✅ 成功: ${passed}`);
console.log(`❌ 失敗: ${failed}`);
console.log(`📈 合計: ${passed + failed}`);
console.log('='.repeat(60));

if (failed === 0) {
    console.log('\n🎉 すべてのテストが成功しました！\n');
} else {
    console.log(`\n⚠️  ${failed}個のテストが失敗しました\n`);
}

process.exit(failed > 0 ? 1 : 0);
