// ファズテスト - ランダムな不正入力と状態変異でバグを検出
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

const bugReports = [];

function reportBug(title, description, severity = 'MEDIUM', context = '') {
    const bug = {
        severity,
        title,
        description,
        context,
        timestamp: new Date().toISOString()
    };
    bugReports.push(bug);
    console.log(`\n🐛 ${severity} BUG: ${title}`);
    console.log(`   ${description}`);
    if (context) {
        console.log(`   コンテキスト: ${context}`);
    }
}

function safeFindGroup(q, r, context) {
    try {
        const result = findGroup(q, r);
        if (!Array.isArray(result)) {
            reportBug(
                'findGroupが配列を返さない',
                `findGroup(${q}, ${r}) が配列でない値を返しました: ${typeof result}`,
                'HIGH',
                context
            );
            return [];
        }
        return result;
    } catch (e) {
        reportBug(
            'findGroupで例外が発生',
            `findGroup(${q}, ${r}) でエラー: ${e.message}\nスタック: ${e.stack}`,
            'HIGH',
            context
        );
        return [];
    }
}

function safeApplyGravity(context) {
    try {
        applyGravity();
    } catch (e) {
        reportBug(
            'applyGravityで例外が発生',
            `applyGravity() でエラー: ${e.message}\nスタック: ${e.stack}`,
            'HIGH',
            context
        );
    }
}

// ===== ファズテスト =====

console.log('💥 ファズテスト開始\n');
console.log('============================================================\n');

// テスト1: 異常な座標値でのfindGroup
console.log('📝 テスト1: 異常な座標値のファズテスト');
console.log('------------------------------------------------------------');
{
    initGrid();

    const fuzzValues = [
        -Infinity, -1000000, -1, 0, GRID_COLS - 1, GRID_COLS, 1000000, Infinity,
        NaN, undefined, null, 0.5, -0.5, 3.14159
    ];

    let testCount = 0;
    for (const q of fuzzValues) {
        for (const r of fuzzValues) {
            const group = safeFindGroup(q, r, `ファズ値: (${q}, ${r})`);
            testCount++;
        }
    }

    console.log(`✅ ${testCount} 個の異常な座標値でテスト完了`);
}

// テスト2: 不正な状態のタイルマップ
console.log('\n📝 テスト2: 不正な状態のタイルマップ');
console.log('------------------------------------------------------------');
{
    // ケース1: キーと座標が一致しないタイル
    gameState.tiles.clear();
    gameState.tiles.set(coordKey(0, 0), { q: 1, r: 1, color: 0 }); // キーと座標が不一致
    gameState.tiles.set(coordKey(2, 2), { q: 2, r: 2, color: 0 });

    const group1 = safeFindGroup(0, 0, 'キーと座標が不一致');
    const group2 = safeFindGroup(1, 1, 'キーと座標が不一致');

    // ケース2: 負の座標を持つタイル
    gameState.tiles.clear();
    gameState.tiles.set(coordKey(-1, -1), { q: -1, r: -1, color: 0 });
    gameState.tiles.set(coordKey(0, 0), { q: 0, r: 0, color: 0 });

    const group3 = safeFindGroup(-1, -1, '負の座標');
    safeApplyGravity('負の座標のタイルに対する重力処理');

    // ケース3: 範囲外の座標を持つタイル
    gameState.tiles.clear();
    gameState.tiles.set(coordKey(100, 100), { q: 100, r: 100, color: 0 });

    const group4 = safeFindGroup(100, 100, '範囲外の座標');
    safeApplyGravity('範囲外の座標のタイルに対する重力処理');

    // ケース4: 無効な色を持つタイル
    gameState.tiles.clear();
    gameState.tiles.set(coordKey(0, 0), { q: 0, r: GRID_ROWS - 1, color: -1 });
    gameState.tiles.set(coordKey(1, 0), { q: 1, r: GRID_ROWS - 1, color: 100 });
    gameState.tiles.set(coordKey(2, 0), { q: 2, r: GRID_ROWS - 1, color: NaN });
    gameState.tiles.set(coordKey(3, 0), { q: 3, r: GRID_ROWS - 1, color: 'red' });

    safeFindGroup(0, 0, '無効な色: -1');
    safeFindGroup(1, 0, '無効な色: 100');
    safeFindGroup(2, 0, '無効な色: NaN');
    safeFindGroup(3, 0, '無効な色: "red"');

    console.log('✅ 不正な状態のテスト完了');
}

// テスト3: 重複座標のタイル
console.log('\n📝 テスト3: 重複座標のタイル');
console.log('------------------------------------------------------------');
{
    gameState.tiles.clear();

    // 同じ座標のタイルを複数のキーで登録（通常はありえない）
    const coord = { q: 3, r: 4 };
    gameState.tiles.set(coordKey(coord.q, coord.r), { ...coord, color: 0 });
    // 異なるキーで同じ座標（coordKeyの実装では起こりえないが、直接操作で可能）
    gameState.tiles.set(`wrong_key`, { ...coord, color: 1 });

    const group = safeFindGroup(coord.q, coord.r, '重複座標のタイル');
    safeApplyGravity('重複座標のタイルに対する重力処理');

    console.log('✅ 重複座標のテスト完了');
}

// テスト4: 大量のタイル削除と復元の繰り返し
console.log('\n📝 テスト4: 大量のタイル削除と復元のストレステスト');
console.log('------------------------------------------------------------');
{
    let crashCount = 0;

    for (let iteration = 0; iteration < 100; iteration++) {
        initGrid();

        // ランダムに削除と復元を繰り返す
        for (let op = 0; op < 50; op++) {
            const q = Math.floor(Math.random() * GRID_COLS);
            const r = Math.floor(Math.random() * GRID_ROWS);

            if (Math.random() < 0.5) {
                // 削除
                gameState.tiles.delete(coordKey(q, r));
            } else {
                // 追加
                gameState.tiles.set(coordKey(q, r), { q, r, color: randomColor() });
            }
        }

        try {
            applyGravity();

            // 整合性チェック：重力処理後、各列で下から詰まっているか
            for (let q = 0; q < GRID_COLS; q++) {
                const columnTiles = [];
                for (let r = 0; r < GRID_ROWS; r++) {
                    if (gameState.tiles.has(coordKey(q, r))) {
                        columnTiles.push(r);
                    }
                }

                if (columnTiles.length > 0) {
                    const expectedStart = GRID_ROWS - columnTiles.length;
                    const actualStart = Math.min(...columnTiles);

                    if (actualStart !== expectedStart) {
                        reportBug(
                            'ランダム操作後の重力処理が不正',
                            `イテレーション ${iteration}, 列 ${q}: タイルが下から詰まっていない`,
                            'HIGH',
                            `期待開始行: ${expectedStart}, 実際: ${actualStart}`
                        );
                    }
                }
            }
        } catch (e) {
            crashCount++;
            reportBug(
                'ランダム操作後にクラッシュ',
                `イテレーション ${iteration} でクラッシュ: ${e.message}`,
                'HIGH',
                e.stack
            );
        }
    }

    if (crashCount === 0) {
        console.log('✅ 100回のランダム操作ストレステスト完了');
    } else {
        console.log(`⚠️  100回中 ${crashCount} 回クラッシュしました`);
    }
}

// テスト5: 循環参照や不正なタイル構造
console.log('\n📝 テスト5: 不正なタイル構造');
console.log('------------------------------------------------------------');
{
    // ケース1: qやrプロパティがないタイル
    gameState.tiles.clear();
    gameState.tiles.set(coordKey(0, GRID_ROWS - 1), { color: 0 }); // qとrがない
    safeFindGroup(0, GRID_ROWS - 1, 'qとrプロパティがないタイル');

    // ケース2: colorプロパティがないタイル
    gameState.tiles.clear();
    gameState.tiles.set(coordKey(0, GRID_ROWS - 1), { q: 0, r: GRID_ROWS - 1 }); // colorがない
    safeFindGroup(0, GRID_ROWS - 1, 'colorプロパティがないタイル');

    // ケース3: 全プロパティがないタイル
    gameState.tiles.clear();
    gameState.tiles.set(coordKey(0, GRID_ROWS - 1), {}); // 全プロパティがない
    safeFindGroup(0, GRID_ROWS - 1, '全プロパティがないタイル');

    // ケース4: タイルがnull
    gameState.tiles.clear();
    gameState.tiles.set(coordKey(0, GRID_ROWS - 1), null);
    safeFindGroup(0, GRID_ROWS - 1, 'タイルがnull');

    console.log('✅ 不正なタイル構造のテスト完了');
}

// テスト6: 極端に大きなグリッドサイズ
console.log('\n📝 テスト6: 座標の極端な値');
console.log('------------------------------------------------------------');
{
    gameState.tiles.clear();

    // 極端に大きな座標
    const hugeCoords = [
        { q: 1000000, r: 1000000 },
        { q: Number.MAX_SAFE_INTEGER, r: Number.MAX_SAFE_INTEGER },
        { q: -1000000, r: -1000000 },
        { q: Number.MIN_SAFE_INTEGER, r: Number.MIN_SAFE_INTEGER }
    ];

    for (const coord of hugeCoords) {
        gameState.tiles.set(coordKey(coord.q, coord.r), { ...coord, color: 0 });
        safeFindGroup(coord.q, coord.r, `極端な座標: (${coord.q}, ${coord.r})`);
    }

    safeApplyGravity('極端な座標のタイルに対する重力処理');

    console.log('✅ 極端な座標のテスト完了');
}

// テスト7: 同時に複数のグループを削除
console.log('\n📝 テスト7: 複数グループの同時削除');
console.log('------------------------------------------------------------');
{
    for (let iteration = 0; iteration < 20; iteration++) {
        initGrid();

        // 複数のグループを見つけて同時に削除
        const groups = [];
        const checked = new Set();

        for (const [key, tile] of gameState.tiles) {
            if (checked.has(key)) continue;

            const group = findGroup(tile.q, tile.r);
            if (group.length >= 2) {
                groups.push(group);
                group.forEach(t => checked.add(coordKey(t.q, t.r)));
            }
        }

        // 全グループを一度に削除（通常のゲームフローでは起こらない）
        for (const group of groups) {
            for (const tile of group) {
                gameState.tiles.delete(coordKey(tile.q, tile.r));
            }
        }

        try {
            applyGravity();
        } catch (e) {
            reportBug(
                '複数グループ同時削除後にクラッシュ',
                `イテレーション ${iteration}: ${e.message}`,
                'HIGH',
                e.stack
            );
        }
    }

    console.log('✅ 複数グループ同時削除のテスト完了');
}

// テスト8: 浮動小数点座標
console.log('\n📝 テスト8: 浮動小数点座標');
console.log('------------------------------------------------------------');
{
    gameState.tiles.clear();

    const floatCoords = [
        { q: 0.5, r: 0.5 },
        { q: 1.1, r: 2.9 },
        { q: -0.1, r: -0.9 },
        { q: 3.14159, r: 2.71828 }
    ];

    for (const coord of floatCoords) {
        gameState.tiles.set(coordKey(coord.q, coord.r), { ...coord, color: 0 });
        safeFindGroup(coord.q, coord.r, `浮動小数点座標: (${coord.q}, ${coord.r})`);
    }

    safeApplyGravity('浮動小数点座標のタイルに対する重力処理');

    console.log('✅ 浮動小数点座標のテスト完了');
}

// ===== 結果レポート =====

console.log('\n============================================================');
console.log('📊 ファズテスト結果');
console.log('============================================================');
console.log(`🐛 発見されたバグ: ${bugReports.length}`);
console.log('============================================================\n');

if (bugReports.length > 0) {
    console.log('🐛 バグレポート詳細:');
    console.log('============================================================');

    const highSeverity = bugReports.filter(b => b.severity === 'HIGH');
    const mediumSeverity = bugReports.filter(b => b.severity === 'MEDIUM');

    if (highSeverity.length > 0) {
        console.log('\n🔴 HIGH SEVERITY:');
        highSeverity.forEach((bug, i) => {
            console.log(`\n${i + 1}. ${bug.title}`);
            console.log(`   説明: ${bug.description}`);
            if (bug.context) {
                console.log(`   詳細: ${bug.context}`);
            }
        });
    }

    if (mediumSeverity.length > 0) {
        console.log('\n🟡 MEDIUM SEVERITY:');
        mediumSeverity.forEach((bug, i) => {
            console.log(`\n${i + 1}. ${bug.title}`);
            console.log(`   説明: ${bug.description}`);
            if (bug.context) {
                console.log(`   詳細: ${bug.context}`);
            }
        });
    }

    console.log('\n============================================================');

    // サマリー
    console.log('\n📈 バグサマリー:');
    const bugTypes = {};
    bugReports.forEach(bug => {
        bugTypes[bug.title] = (bugTypes[bug.title] || 0) + 1;
    });
    Object.entries(bugTypes).forEach(([title, count]) => {
        console.log(`   - ${title}: ${count}件`);
    });

    process.exit(1);
} else {
    console.log('🎉 バグは検出されませんでした！\n');
    process.exit(0);
}
