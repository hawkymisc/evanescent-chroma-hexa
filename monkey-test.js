// モンキーテスト - ランダム操作でバグを検出
// Node.js環境で実行

// ===== ゲームロジックの定数 =====
const GRID_COLS = 8;
const GRID_ROWS = 9;
const NUM_COLORS = 4;

let gameState = {
    tiles: new Map(),
    score: 0,
    gameOver: false
};

// ===== ゲームロジックの関数（game.jsからコピー） =====

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

function initGrid() {
    gameState.tiles.clear();
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

// ===== テストユーティリティ =====

let testCount = 0;
let failCount = 0;
const bugReports = [];

function assert(condition, message) {
    testCount++;
    if (!condition) {
        failCount++;
        const error = `❌ ${message}`;
        console.log(error);
        bugReports.push(error);
        return false;
    }
    return true;
}

function reportBug(title, description, severity = 'MEDIUM') {
    const bug = {
        severity,
        title,
        description,
        timestamp: new Date().toISOString()
    };
    bugReports.push(bug);
    console.log(`\n🐛 ${severity} BUG: ${title}`);
    console.log(`   ${description}`);
}

// ゲーム状態の整合性チェック
function validateGameState(context) {
    let isValid = true;

    // 1. タイルの座標が重複していないか
    const coords = new Set();
    for (const [key, tile] of gameState.tiles) {
        const coordStr = `${tile.q},${tile.r}`;
        if (coords.has(coordStr)) {
            reportBug(
                'タイルの座標が重複',
                `座標 (${tile.q}, ${tile.r}) が重複しています。コンテキスト: ${context}`,
                'HIGH'
            );
            isValid = false;
        }
        coords.add(coordStr);

        // キーと実際の座標が一致するか
        if (key !== coordStr) {
            reportBug(
                'マップキーと座標が不一致',
                `キー "${key}" と座標 (${tile.q}, ${tile.r}) が一致しません。コンテキスト: ${context}`,
                'HIGH'
            );
            isValid = false;
        }
    }

    // 2. タイルの位置が範囲内か
    for (const [key, tile] of gameState.tiles) {
        if (tile.q < 0 || tile.q >= GRID_COLS) {
            reportBug(
                'タイルのq座標が範囲外',
                `タイル (${tile.q}, ${tile.r}) のq座標が範囲外です [0, ${GRID_COLS})。コンテキスト: ${context}`,
                'HIGH'
            );
            isValid = false;
        }
        if (tile.r < 0 || tile.r >= GRID_ROWS) {
            reportBug(
                'タイルのr座標が範囲外',
                `タイル (${tile.q}, ${tile.r}) のr座標が範囲外です [0, ${GRID_ROWS})。コンテキスト: ${context}`,
                'HIGH'
            );
            isValid = false;
        }
    }

    // 3. 各列で、タイルが下から詰まっているか（重力処理の正確性）
    for (let q = 0; q < GRID_COLS; q++) {
        const columnTiles = [];
        for (let r = 0; r < GRID_ROWS; r++) {
            if (gameState.tiles.has(coordKey(q, r))) {
                columnTiles.push(r);
            }
        }

        if (columnTiles.length > 0) {
            // 最初のタイルが下端から始まっているか確認
            const expectedStart = GRID_ROWS - columnTiles.length;
            const actualStart = Math.min(...columnTiles);

            if (actualStart !== expectedStart) {
                reportBug(
                    '重力処理が不完全',
                    `列 ${q} のタイルが下から詰まっていません。期待: ${expectedStart}, 実際: ${actualStart}。コンテキスト: ${context}`,
                    'HIGH'
                );
                isValid = false;
            }

            // タイルが連続しているか確認
            for (let i = 0; i < columnTiles.length; i++) {
                const expectedR = expectedStart + i;
                if (!columnTiles.includes(expectedR)) {
                    reportBug(
                        'タイルに隙間がある',
                        `列 ${q} の r=${expectedR} に隙間があります。コンテキスト: ${context}`,
                        'HIGH'
                    );
                    isValid = false;
                    break;
                }
            }
        }
    }

    return isValid;
}

// ===== モンキーテスト =====

console.log('🐒 モンキーテスト開始\n');
console.log('============================================================\n');

// テスト1: ランダムな大量クリック
console.log('📝 テスト1: ランダムな大量クリック (1000回)');
console.log('------------------------------------------------------------');
{
    initGrid();
    let clickCount = 0;
    let validClicks = 0;
    let invalidClicks = 0;

    for (let i = 0; i < 1000; i++) {
        // ランダムな座標を生成（範囲内と範囲外を混在）
        const q = Math.floor(Math.random() * 12) - 2; // -2 to 9
        const r = Math.floor(Math.random() * 13) - 2; // -2 to 10

        const beforeSize = gameState.tiles.size;
        const beforeScore = gameState.score;

        // クリックをシミュレート
        const group = findGroup(q, r);
        if (group.length >= 2) {
            validClicks++;
            group.forEach(tile => {
                gameState.tiles.delete(coordKey(tile.q, tile.r));
            });
            const points = Math.pow(group.length - 2, 2);
            gameState.score += points;
            applyGravity();

            // 状態の整合性をチェック
            if (!validateGameState(`ランダムクリック ${i+1}: (${q}, ${r})`)) {
                break;
            }
        } else {
            invalidClicks++;
        }

        clickCount++;
    }

    console.log(`✅ ${clickCount} 回のクリックを実行`);
    console.log(`   有効: ${validClicks}, 無効: ${invalidClicks}`);
    console.log(`   最終スコア: ${gameState.score}`);
    console.log(`   残りタイル: ${gameState.tiles.size}`);
}

// テスト2: 境界外座標のテスト
console.log('\n📝 テスト2: 境界外座標のストレステスト');
console.log('------------------------------------------------------------');
{
    initGrid();
    const testCases = [
        { q: -1, r: 0 },
        { q: 0, r: -1 },
        { q: GRID_COLS, r: 0 },
        { q: 0, r: GRID_ROWS },
        { q: -100, r: -100 },
        { q: 1000, r: 1000 },
        { q: NaN, r: NaN },
        { q: Infinity, r: Infinity },
    ];

    for (const {q, r} of testCases) {
        try {
            const group = findGroup(q, r);
            assert(
                Array.isArray(group) && group.length === 0,
                `境界外座標 (${q}, ${r}) は空配列を返すべき`
            );
        } catch (e) {
            reportBug(
                '境界外座標でエラー',
                `座標 (${q}, ${r}) でエラー: ${e.message}`,
                'MEDIUM'
            );
        }
    }
    console.log(`✅ 境界外座標テスト完了`);
}

// テスト3: 同じ座標を連続でクリック
console.log('\n📝 テスト3: 同じ座標の連続クリック');
console.log('------------------------------------------------------------');
{
    initGrid();

    // 消せるグループを見つける
    let targetQ = -1, targetR = -1;
    for (let q = 0; q < GRID_COLS; q++) {
        for (let r = 0; r < GRID_ROWS; r++) {
            const group = findGroup(q, r);
            if (group.length >= 2) {
                targetQ = q;
                targetR = r;
                break;
            }
        }
        if (targetQ >= 0) break;
    }

    if (targetQ >= 0) {
        const firstGroup = findGroup(targetQ, targetR);
        console.log(`   ターゲット座標: (${targetQ}, ${targetR}), グループサイズ: ${firstGroup.length}`);

        // 1回目のクリック
        firstGroup.forEach(tile => {
            gameState.tiles.delete(coordKey(tile.q, tile.r));
        });
        gameState.score += Math.pow(firstGroup.length - 2, 2);
        applyGravity();
        validateGameState('1回目のクリック後');

        // 2回目のクリック（同じ座標）
        const secondGroup = findGroup(targetQ, targetR);
        console.log(`   2回目のグループサイズ: ${secondGroup.length}`);

        if (secondGroup.length >= 2) {
            secondGroup.forEach(tile => {
                gameState.tiles.delete(coordKey(tile.q, tile.r));
            });
            gameState.score += Math.pow(secondGroup.length - 2, 2);
            applyGravity();
            validateGameState('2回目のクリック後');
        }

        console.log(`✅ 連続クリックテスト完了`);
    } else {
        console.log(`⚠️  消せるグループが見つかりませんでした`);
    }
}

// テスト4: 全タイル消去までのプレイスルー
console.log('\n📝 テスト4: 全タイル消去までのプレイスルー');
console.log('------------------------------------------------------------');
{
    initGrid();
    let moveCount = 0;
    const maxMoves = 1000;

    while (gameState.tiles.size > 0 && moveCount < maxMoves) {
        // 消せるグループを探す
        let foundGroup = false;

        for (const [key, tile] of gameState.tiles) {
            const group = findGroup(tile.q, tile.r);
            if (group.length >= 2) {
                group.forEach(t => {
                    gameState.tiles.delete(coordKey(t.q, t.r));
                });
                gameState.score += Math.pow(group.length - 2, 2);
                applyGravity();

                if (!validateGameState(`移動 ${moveCount + 1}`)) {
                    reportBug(
                        'プレイスルー中に状態が破損',
                        `移動 ${moveCount + 1} 後に状態が不正になりました`,
                        'HIGH'
                    );
                }

                foundGroup = true;
                break;
            }
        }

        if (!foundGroup) {
            console.log(`   ゲーム終了: ${moveCount} 手で終了`);
            console.log(`   残りタイル: ${gameState.tiles.size}`);
            console.log(`   最終スコア: ${gameState.score}`);
            break;
        }

        moveCount++;
    }

    if (moveCount >= maxMoves) {
        console.log(`⚠️  ${maxMoves} 手に到達（無限ループの可能性）`);
    } else {
        console.log(`✅ プレイスルー完了`);
    }
}

// テスト5: ゲームオーバー後の操作
console.log('\n📝 テスト5: ゲームオーバー後の操作');
console.log('------------------------------------------------------------');
{
    // 全タイル異色のグリッドを作成
    gameState.tiles.clear();
    gameState.score = 0;
    gameState.gameOver = false;

    let color = 0;
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let q = 0; q < GRID_COLS; q++) {
            gameState.tiles.set(coordKey(q, r), { q, r, color: color % NUM_COLORS });
            color++;
        }
    }

    // ゲームオーバー判定
    checkGameOver();

    if (gameState.gameOver) {
        console.log(`   ゲームオーバー状態を確認`);

        // ゲームオーバー後にクリックを試みる
        const beforeSize = gameState.tiles.size;
        const beforeScore = gameState.score;

        // handleTileClickはgameOverをチェックするが、
        // 直接グループを削除する場合の挙動を確認
        for (let i = 0; i < 10; i++) {
            const q = Math.floor(Math.random() * GRID_COLS);
            const r = Math.floor(Math.random() * GRID_ROWS);
            const group = findGroup(q, r);
            // ゲームオーバー後でもfindGroupは動作する
        }

        console.log(`✅ ゲームオーバー後の操作テスト完了`);
    } else {
        console.log(`⚠️  ゲームオーバーにならなかった`);
    }
}

// テスト6: 重力処理の極端なケース
console.log('\n📝 テスト6: 重力処理のストレステスト');
console.log('------------------------------------------------------------');
{
    // 各列の一番下のタイルだけを残す
    gameState.tiles.clear();
    for (let q = 0; q < GRID_COLS; q++) {
        gameState.tiles.set(coordKey(q, GRID_ROWS - 1), {
            q,
            r: GRID_ROWS - 1,
            color: q % NUM_COLORS
        });
    }

    applyGravity();
    validateGameState('一番下のタイルのみ');

    // すべて削除
    gameState.tiles.clear();
    applyGravity();
    assert(gameState.tiles.size === 0, '空グリッドで重力処理');

    // 1列だけタイルを配置
    gameState.tiles.clear();
    for (let r = 0; r < GRID_ROWS; r++) {
        if (r % 2 === 0) { // 歯抜けにする
            gameState.tiles.set(coordKey(3, r), { q: 3, r, color: 0 });
        }
    }

    const beforeCount = gameState.tiles.size;
    applyGravity();
    validateGameState('歯抜けの列');

    // 重力処理後、タイルが下から詰まっているか確認
    let isCompact = true;
    const expectedR = GRID_ROWS - beforeCount;
    for (let r = expectedR; r < GRID_ROWS; r++) {
        if (!gameState.tiles.has(coordKey(3, r))) {
            isCompact = false;
            reportBug(
                '重力処理後にタイルが詰まっていない',
                `列 3 の r=${r} にタイルがありません`,
                'HIGH'
            );
        }
    }

    if (isCompact) {
        console.log(`✅ 重力処理ストレステスト完了`);
    }
}

// テスト7: 大量の小グループ消去
console.log('\n📝 テスト7: 大量の小グループ消去（ストレステスト）');
console.log('------------------------------------------------------------');
{
    // 全て同じ色のグリッドを作成
    gameState.tiles.clear();
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let q = 0; q < GRID_COLS; q++) {
            gameState.tiles.set(coordKey(q, r), { q, r, color: 0 });
        }
    }

    console.log(`   初期タイル数: ${gameState.tiles.size}`);

    // 1つずつランダムにグループを消していく
    let iterations = 0;
    while (gameState.tiles.size > 0 && iterations < 100) {
        const tilesArray = Array.from(gameState.tiles.values());
        const randomTile = tilesArray[Math.floor(Math.random() * tilesArray.length)];

        const group = findGroup(randomTile.q, randomTile.r);
        if (group.length >= 2) {
            group.forEach(tile => {
                gameState.tiles.delete(coordKey(tile.q, tile.r));
            });
            applyGravity();

            if (!validateGameState(`大量消去 ${iterations + 1}`)) {
                break;
            }
        }

        iterations++;
    }

    console.log(`   ${iterations} 回の消去を実行`);
    console.log(`   残りタイル数: ${gameState.tiles.size}`);
    console.log(`✅ 大量消去テスト完了`);
}

// ===== 結果レポート =====

console.log('\n============================================================');
console.log('📊 モンキーテスト結果');
console.log('============================================================');
console.log(`✅ アサーション成功: ${testCount - failCount}`);
console.log(`❌ アサーション失敗: ${failCount}`);
console.log(`📈 合計アサーション: ${testCount}`);
console.log(`🐛 発見されたバグ: ${bugReports.length}`);
console.log('============================================================\n');

if (bugReports.length > 0) {
    console.log('🐛 バグレポート詳細:');
    console.log('============================================================');

    const highSeverity = bugReports.filter(b => b.severity === 'HIGH');
    const mediumSeverity = bugReports.filter(b => b.severity === 'MEDIUM');
    const lowSeverity = bugReports.filter(b => b.severity === 'LOW');

    if (highSeverity.length > 0) {
        console.log('\n🔴 HIGH SEVERITY:');
        highSeverity.forEach((bug, i) => {
            if (typeof bug === 'string') {
                console.log(`${i + 1}. ${bug}`);
            } else {
                console.log(`${i + 1}. ${bug.title}`);
                console.log(`   ${bug.description}`);
            }
        });
    }

    if (mediumSeverity.length > 0) {
        console.log('\n🟡 MEDIUM SEVERITY:');
        mediumSeverity.forEach((bug, i) => {
            if (typeof bug === 'string') {
                console.log(`${i + 1}. ${bug}`);
            } else {
                console.log(`${i + 1}. ${bug.title}`);
                console.log(`   ${bug.description}`);
            }
        });
    }

    if (lowSeverity.length > 0) {
        console.log('\n🟢 LOW SEVERITY:');
        lowSeverity.forEach((bug, i) => {
            if (typeof bug === 'string') {
                console.log(`${i + 1}. ${bug}`);
            } else {
                console.log(`${i + 1}. ${bug.title}`);
                console.log(`   ${bug.description}`);
            }
        });
    }

    console.log('\n============================================================');
    process.exit(1);
} else {
    console.log('🎉 バグは検出されませんでした！\n');
    process.exit(0);
}
