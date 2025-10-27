// 六角形パズルゲーム - ゲームロジック

// ===== 定数 =====
const GRID_COLS = 8;
const GRID_ROWS = 9;
const NUM_COLORS = 4;

// ===== ゲーム状態 =====
let gameState = {
    tiles: new Map(), // key: "q,r", value: {q, r, color}
    score: 0,
    gameOver: false
};

// ===== 六角形座標ユーティリティ =====

// Offset座標からピクセル座標への変換（Pointy-top、even-r方式）
function hexToPixel(q, r) {
    // CSS六角形の寸法
    const hexWidth = 60;   // 横幅
    const hexHeight = 70;  // 高さ

    // 六角形の一辺の長さ（右の垂直辺の長さ）
    const edgeLength = 35; // (52.5 - 17.5) = 35px
    const size = edgeLength;

    // Offset座標系（even-r）からピクセル座標への変換
    // 奇数行は横方向に size * √3 / 2 だけオフセット
    // これにより、n行目とn+2行目のx座標が一致する
    const x = size * Math.sqrt(3) * (q + 0.5 * (r % 2));
    const y = size * 1.5 * r;

    return { x, y };
}

// 座標キーを生成
function coordKey(q, r) {
    return `${q},${r}`;
}

// 6方向の隣接オフセット（Offset座標系 even-r方式）
// 偶数行と奇数行で異なるオフセットを使用
const NEIGHBOR_OFFSETS_EVEN = [
    { dq: +1, dr: 0 },  // 右
    { dq: 0, dr: -1 },  // 右上
    { dq: -1, dr: -1 }, // 左上
    { dq: -1, dr: 0 },  // 左
    { dq: -1, dr: +1 }, // 左下
    { dq: 0, dr: +1 }   // 右下
];

const NEIGHBOR_OFFSETS_ODD = [
    { dq: +1, dr: 0 },  // 右
    { dq: +1, dr: -1 }, // 右上
    { dq: 0, dr: -1 },  // 左上
    { dq: -1, dr: 0 },  // 左
    { dq: 0, dr: +1 },  // 左下
    { dq: +1, dr: +1 }  // 右下
];

// 隣接タイルの座標を取得
function getNeighbors(q, r) {
    const offsets = (r % 2 === 0) ? NEIGHBOR_OFFSETS_EVEN : NEIGHBOR_OFFSETS_ODD;
    return offsets.map(offset => ({
        q: q + offset.dq,
        r: r + offset.dr
    }));
}

// ===== グリッド生成 =====

// ランダムな色を生成
function randomColor() {
    return Math.floor(Math.random() * NUM_COLORS);
}

// グリッドを初期化
function initGrid() {
    gameState.tiles.clear();

    // Pointy-topの六角形グリッドを生成
    // オフセット座標系を使用して、視覚的に自然な配置にする
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let q = 0; q < GRID_COLS; q++) {
            const tile = {
                q: q,
                r: r,
                color: randomColor()
            };
            gameState.tiles.set(coordKey(q, r), tile);
        }
    }
}

// ===== レンダリング =====

// グリッドを描画
function renderGrid() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';

    gameState.tiles.forEach(tile => {
        const hexEl = document.createElement('div');
        hexEl.className = `hex-tile color-${tile.color}`;
        hexEl.dataset.q = tile.q;
        hexEl.dataset.r = tile.r;

        // 位置を計算（中央寄せのためオフセット追加）
        const pos = hexToPixel(tile.q, tile.r);
        hexEl.style.left = `${pos.x + 100}px`;
        hexEl.style.top = `${pos.y + 50}px`;

        // イベントリスナー
        hexEl.addEventListener('click', () => handleTileClick(tile.q, tile.r));
        hexEl.addEventListener('mouseenter', () => handleTileHover(tile.q, tile.r));
        hexEl.addEventListener('mouseleave', clearHighlight);

        board.appendChild(hexEl);
    });
}

// スコアを更新
function updateScore() {
    document.getElementById('score').textContent = gameState.score;
}

// ===== ゲームロジック =====

// グループ検出（BFS）
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

        // 隣接タイルをキューに追加
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

// タイルのハイライト
function handleTileHover(q, r) {
    clearHighlight();

    const group = findGroup(q, r);
    if (group.length < 2) return; // 2個未満は消せない

    // グループをハイライト
    group.forEach(tile => {
        const el = document.querySelector(`[data-q="${tile.q}"][data-r="${tile.r}"]`);
        if (el) el.classList.add('highlight');
    });
}

// ハイライトをクリア
function clearHighlight() {
    document.querySelectorAll('.hex-tile').forEach(el => {
        el.classList.remove('highlight');
    });
}

// タイルクリック処理
function handleTileClick(q, r) {
    if (gameState.gameOver) return;

    const group = findGroup(q, r);
    if (group.length < 2) return; // 2個未満は消せない

    // タイルを消去
    group.forEach(tile => {
        gameState.tiles.delete(coordKey(tile.q, tile.r));
    });

    // スコア計算: (n - 2)²
    const points = Math.pow(group.length - 2, 2);
    gameState.score += points;

    // 重力処理
    applyGravity();

    // 再描画
    renderGrid();
    updateScore();

    // ゲーム終了判定
    checkGameOver();
}

// 重力処理（縦列単純落下）
function applyGravity() {
    // 各列ごとに処理
    for (let q = 0; q < GRID_COLS; q++) {
        // その列のタイルを取得して、下から詰める
        const columnTiles = [];

        for (let r = 0; r < GRID_ROWS; r++) {
            const tile = gameState.tiles.get(coordKey(q, r));
            if (tile) {
                columnTiles.push(tile);
            }
        }

        // 下から詰め直す
        for (let r = 0; r < GRID_ROWS; r++) {
            gameState.tiles.delete(coordKey(q, r));
        }

        // 下から配置し直す
        const startRow = GRID_ROWS - columnTiles.length;
        columnTiles.forEach((tile, index) => {
            const newR = startRow + index;
            tile.r = newR;
            gameState.tiles.set(coordKey(q, newR), tile);
        });
    }
}

// ゲーム終了判定
function checkGameOver() {
    // 全タイルをチェックして、消せるグループがあるか確認
    const checked = new Set();

    for (const [key, tile] of gameState.tiles) {
        if (checked.has(key)) continue;

        const group = findGroup(tile.q, tile.r);
        group.forEach(t => checked.add(coordKey(t.q, t.r)));

        if (group.length >= 2) {
            // まだ消せるグループがある
            return;
        }
    }

    // 消せるグループがない = ゲーム終了
    gameState.gameOver = true;
    showGameOver();
}

// ゲーム終了画面を表示
function showGameOver() {
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('game-over-overlay').classList.remove('hidden');
}

// ===== ゲーム初期化 =====

function newGame() {
    gameState.score = 0;
    gameState.gameOver = false;

    initGrid();
    renderGrid();
    updateScore();

    document.getElementById('game-over-overlay').classList.add('hidden');
}

// ===== 初期化 =====

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('new-game-btn').addEventListener('click', newGame);
    document.getElementById('restart-btn').addEventListener('click', newGame);

    // 最初のゲームを開始
    newGame();
});
