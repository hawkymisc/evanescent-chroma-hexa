// 六角形パズルゲーム - ゲームロジック

// ===== 定数 =====
const GRID_COLS = 8;
const GRID_ROWS = 9;
const NUM_COLORS = 4;

// アニメーション速度設定（ミリ秒）
// 削除とスライドは順番に実行されるため、合計時間が体感速度になる
const ANIMATION_SPEEDS = {
    'super-fast': { remove: 40, slide: 60 },   // 合計 0.1秒
    'fast': { remove: 120, slide: 180 },       // 合計 0.3秒
    'normal': { remove: 200, slide: 300 }      // 合計 0.5秒
};

// ===== ゲーム状態 =====
let gameState = {
    tiles: new Map(), // key: "q,r", value: {q, r, color}
    score: 0,
    gameOver: false,
    isAnimating: false, // アニメーション中かどうか
    animationSpeed: 'normal' // デフォルトの速度
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

// タイルのDOM要素を作成
function createTileElement(tile) {
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

    return hexEl;
}

// グリッドを描画（差分更新版）
function renderGrid() {
    const board = document.getElementById('game-board');

    // 既存のタイルをマップに保存
    const existingTiles = new Map();
    board.querySelectorAll('.hex-tile').forEach(el => {
        const key = coordKey(Number(el.dataset.q), Number(el.dataset.r));
        existingTiles.set(key, el);
    });

    // 新しいタイルを追加、既存のタイルは位置を更新
    gameState.tiles.forEach(tile => {
        const key = coordKey(tile.q, tile.r);
        let hexEl = existingTiles.get(key);

        if (!hexEl) {
            // 新しいタイルを作成
            hexEl = createTileElement(tile);
            board.appendChild(hexEl);
        } else {
            // 既存のタイルの位置を更新（色が変わる可能性もあるが、このゲームでは変わらない）
            const pos = hexToPixel(tile.q, tile.r);
            hexEl.style.left = `${pos.x + 100}px`;
            hexEl.style.top = `${pos.y + 50}px`;
            // 使用済みとしてマークするため削除
            existingTiles.delete(key);
        }
    });

    // 使われなかったタイルを削除
    existingTiles.forEach(el => {
        el.remove();
    });
}

// グリッドを完全に再描画（初期化時のみ使用）
function renderGridFull() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';

    gameState.tiles.forEach(tile => {
        const hexEl = createTileElement(tile);
        board.appendChild(hexEl);
    });
}

// スコアを更新
function updateScore() {
    document.getElementById('score').textContent = gameState.score;
}

// ===== アニメーションユーティリティ =====

// アニメーション速度を取得
function getAnimationDurations() {
    return ANIMATION_SPEEDS[gameState.animationSpeed];
}

// タイルの削除アニメーション
function animateTileRemoval(tiles) {
    const durations = getAnimationDurations();
    const board = document.getElementById('game-board');

    return new Promise(resolve => {
        // 削除対象のタイルにアニメーションクラスを追加
        tiles.forEach(tile => {
            const el = board.querySelector(`[data-q="${tile.q}"][data-r="${tile.r}"]`);
            if (el) {
                el.classList.add('removing');
            }
        });

        // アニメーション完了を待つ
        setTimeout(() => {
            // DOM から削除
            tiles.forEach(tile => {
                const el = board.querySelector(`[data-q="${tile.q}"][data-r="${tile.r}"]`);
                if (el) {
                    el.remove();
                }
            });
            resolve();
        }, durations.remove);
    });
}

// タイルのスライドアニメーション
function animateTileSlide() {
    const durations = getAnimationDurations();
    const board = document.getElementById('game-board');

    return new Promise(resolve => {
        // DOM要素を古い座標から新しい座標にマッピング
        // 古い座標(DOM上のdata-q, data-r) → 新しい座標(gameState.tiles内のq, r)
        const oldToNewMap = new Map();

        // gameState.tiles内の各タイルについて、DOM上のどの要素に対応するかを探す
        // 同じ色のタイルが同じ列(q)にある場合、上から順に対応付ける
        for (let q = 0; q < GRID_COLS; q++) {
            // 現在のDOM上の、この列のタイル（上から下）
            const domTilesInColumn = [];
            board.querySelectorAll(`.hex-tile[data-q="${q}"]`).forEach(el => {
                domTilesInColumn.push({
                    el: el,
                    r: Number(el.dataset.r),
                    color: Number(el.className.match(/color-(\d+)/)[1])
                });
            });
            domTilesInColumn.sort((a, b) => a.r - b.r);

            // gameState.tiles内の、この列のタイル（上から下）
            const stateTilesInColumn = [];
            gameState.tiles.forEach(tile => {
                if (tile.q === q) {
                    stateTilesInColumn.push(tile);
                }
            });
            stateTilesInColumn.sort((a, b) => a.r - b.r);

            // 対応付け（同じインデックス同士が対応）
            for (let i = 0; i < domTilesInColumn.length && i < stateTilesInColumn.length; i++) {
                const domTile = domTilesInColumn[i];
                const stateTile = stateTilesInColumn[i];
                oldToNewMap.set(domTile.el, stateTile);
            }
        }

        // すべてのタイルにアニメーションクラスを追加し、新しい位置を設定
        oldToNewMap.forEach((newTile, el) => {
            el.classList.add('animating');
            const pos = hexToPixel(newTile.q, newTile.r);
            el.style.left = `${pos.x + 100}px`;
            el.style.top = `${pos.y + 50}px`;
            // dataset も更新
            el.dataset.q = newTile.q;
            el.dataset.r = newTile.r;
        });

        // アニメーション完了を待つ
        setTimeout(() => {
            // アニメーションクラスを削除
            board.querySelectorAll('.hex-tile').forEach(el => {
                el.classList.remove('animating');
            });
            resolve();
        }, durations.slide);
    });
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
    if (gameState.isAnimating) return;

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

// タイルクリック処理（非同期版）
async function handleTileClick(q, r) {
    if (gameState.gameOver || gameState.isAnimating) return;

    const group = findGroup(q, r);
    if (group.length < 2) return; // 2個未満は消せない

    // アニメーション開始
    gameState.isAnimating = true;
    clearHighlight();

    // スコア計算: (n - 2)²
    const points = Math.pow(group.length - 2, 2);
    gameState.score += points;
    updateScore();

    // 1. タイル削除アニメーション
    await animateTileRemoval(group);

    // 2. ゲーム状態からタイルを削除
    group.forEach(tile => {
        gameState.tiles.delete(coordKey(tile.q, tile.r));
    });

    // 3. 重力処理（座標を計算）
    applyGravity();

    // 4. スライドアニメーション
    await animateTileSlide();

    // アニメーション終了
    gameState.isAnimating = false;

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

// アニメーション速度を変更
function changeAnimationSpeed(speed) {
    gameState.animationSpeed = speed;
    const board = document.getElementById('game-board');

    // 既存の速度クラスを削除
    board.classList.remove('speed-super-fast', 'speed-fast', 'speed-normal');

    // 新しい速度クラスを追加
    board.classList.add(`speed-${speed}`);
}

// ===== ゲーム初期化 =====

function newGame() {
    gameState.score = 0;
    gameState.gameOver = false;
    gameState.isAnimating = false;

    initGrid();
    renderGridFull();
    updateScore();

    document.getElementById('game-over-overlay').classList.add('hidden');
}

// ===== 初期化 =====

document.addEventListener('DOMContentLoaded', () => {
    // ボタンイベント
    document.getElementById('new-game-btn').addEventListener('click', newGame);
    document.getElementById('restart-btn').addEventListener('click', newGame);

    // アニメーション速度変更
    const speedSelect = document.getElementById('animation-speed');
    speedSelect.addEventListener('change', (e) => {
        changeAnimationSpeed(e.target.value);
    });

    // 初期速度を設定
    changeAnimationSpeed(gameState.animationSpeed);

    // 最初のゲームを開始
    newGame();
});
