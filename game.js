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

// ハイスコア情報
let highScore = {
    score: 0,
    date: null
};

// ===== Cookie管理 =====

// Cookieに値を保存（事実上無期限）
function setCookie(name, value) {
    // 10年後の日付（事実上無期限）
    const date = new Date();
    date.setTime(date.getTime() + (10 * 365 * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/";
}

// Cookieから値を取得
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1);
        if (c.indexOf(nameEQ) === 0) {
            return decodeURIComponent(c.substring(nameEQ.length));
        }
    }
    return null;
}

// ハイスコアをCookieから読み込む
function loadHighScore() {
    const scoreStr = getCookie('highScore');
    const dateStr = getCookie('highScoreDate');

    if (scoreStr) {
        highScore.score = parseInt(scoreStr, 10) || 0;
    }
    if (dateStr) {
        highScore.date = dateStr;
    }

    updateHighScoreDisplay();
}

// ハイスコアをCookieに保存
function saveHighScore(score) {
    const now = new Date();
    const dateStr = now.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });

    highScore.score = score;
    highScore.date = dateStr;

    setCookie('highScore', score.toString());
    setCookie('highScoreDate', dateStr);

    updateHighScoreDisplay();
}

// ハイスコア表示を更新
function updateHighScoreDisplay() {
    const highScoreElement = document.getElementById('high-score');
    const highScoreDateElement = document.getElementById('high-score-date');

    if (highScoreElement) {
        highScoreElement.textContent = highScore.score;
    }
    if (highScoreDateElement && highScore.date) {
        highScoreDateElement.textContent = `(${highScore.date})`;
    }
}

// ===== 六角形座標ユーティリティ =====

// 画面サイズに応じたスケーリング係数を計算
function calculateScale() {
    const board = document.getElementById('game-board');
    if (!board) return 1;

    const boardWidth = board.clientWidth;
    const boardHeight = board.clientHeight;

    // 基準サイズ（デザイン時のサイズ）
    const baseWidth = 700;
    const baseHeight = 600;

    // スケール係数（小さい方を採用）
    const scaleX = boardWidth / baseWidth;
    const scaleY = boardHeight / baseHeight;
    const scale = Math.min(scaleX, scaleY, 1); // 1を超えないように

    return scale;
}

// グリッド全体のサイズとオフセットを計算
function calculateGridLayout() {
    const scale = calculateScale();
    const board = document.getElementById('game-board');

    if (!board) {
        return {
            scale: 1,
            offsetX: 100,
            offsetY: 50
        };
    }

    const boardWidth = board.clientWidth;
    const boardHeight = board.clientHeight;

    // 六角形のサイズ
    const edgeLength = 35 * scale;
    const size = edgeLength;

    // グリッド全体のサイズを計算
    const gridWidth = size * Math.sqrt(3) * (GRID_COLS + 0.5);
    const gridHeight = size * 1.5 * (GRID_ROWS - 1) + size * 2;

    // 中央配置のためのオフセットを計算
    const offsetX = Math.max(0, (boardWidth - gridWidth) / 2);
    const offsetY = Math.max(0, (boardHeight - gridHeight) / 2);

    return {
        scale: scale,
        offsetX: offsetX,
        offsetY: offsetY
    };
}

// Offset座標からピクセル座標への変換（Pointy-top、even-r方式）
function hexToPixel(q, r, scale = 1) {
    // CSS六角形の寸法
    const hexWidth = 60;   // 横幅
    const hexHeight = 70;  // 高さ

    // 六角形の一辺の長さ（右の垂直辺の長さ）
    const edgeLength = 35; // (52.5 - 17.5) = 35px
    const size = edgeLength * scale;

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
    const layout = calculateGridLayout();
    const hexEl = document.createElement('div');
    hexEl.className = `hex-tile color-${tile.color}`;
    hexEl.dataset.q = tile.q;
    hexEl.dataset.r = tile.r;

    // スケールに応じたサイズ設定
    const scaledWidth = 60.62 * layout.scale;
    const scaledHeight = 70 * layout.scale;
    hexEl.style.width = `${scaledWidth}px`;
    hexEl.style.height = `${scaledHeight}px`;

    // 位置を計算（中央寄せのためオフセット追加）
    const pos = hexToPixel(tile.q, tile.r, layout.scale);
    hexEl.style.left = `${pos.x + layout.offsetX}px`;
    hexEl.style.top = `${pos.y + layout.offsetY}px`;

    // イベントリスナー
    hexEl.addEventListener('click', () => handleTileClick(tile.q, tile.r));
    hexEl.addEventListener('mouseenter', () => handleTileHover(tile.q, tile.r));
    hexEl.addEventListener('mouseleave', clearHighlight);

    return hexEl;
}

// グリッドを描画（差分更新版）
function renderGrid() {
    const board = document.getElementById('game-board');
    const layout = calculateGridLayout();

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
            // 既存のタイルの位置とサイズを更新
            const scaledWidth = 60.62 * layout.scale;
            const scaledHeight = 70 * layout.scale;
            hexEl.style.width = `${scaledWidth}px`;
            hexEl.style.height = `${scaledHeight}px`;

            const pos = hexToPixel(tile.q, tile.r, layout.scale);
            hexEl.style.left = `${pos.x + layout.offsetX}px`;
            hexEl.style.top = `${pos.y + layout.offsetY}px`;
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
    const layout = calculateGridLayout();

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
            const pos = hexToPixel(newTile.q, newTile.r, layout.scale);
            el.style.left = `${pos.x + layout.offsetX}px`;
            el.style.top = `${pos.y + layout.offsetY}px`;
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

    // ハイスコアチェック
    if (gameState.score > highScore.score) {
        saveHighScore(gameState.score);
        // 新記録メッセージを表示
        const newRecordMsg = document.getElementById('new-record-message');
        if (newRecordMsg) {
            newRecordMsg.classList.remove('hidden');
        }
    } else {
        // 新記録メッセージを非表示
        const newRecordMsg = document.getElementById('new-record-message');
        if (newRecordMsg) {
            newRecordMsg.classList.add('hidden');
        }
    }

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
    // ハイスコアを読み込む
    loadHighScore();

    // ボタンイベント
    document.getElementById('new-game-btn').addEventListener('click', newGame);
    document.getElementById('restart-btn').addEventListener('click', newGame);

    // アニメーション速度変更
    const speedSelect = document.getElementById('animation-speed');
    speedSelect.addEventListener('change', (e) => {
        changeAnimationSpeed(e.target.value);
    });

    // ウィンドウリサイズ時にタイルの位置とサイズを再計算
    let resizeTimeout;
    window.addEventListener('resize', () => {
        // デバウンス処理（リサイズイベントが連続して発生するのを防ぐ）
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (!gameState.isAnimating) {
                renderGrid();
            }
        }, 100);
    });

    // 初期速度を設定
    changeAnimationSpeed(gameState.animationSpeed);

    // 最初のゲームを開始
    newGame();
});
