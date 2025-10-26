// 高度なモンキーテスト - より厳密なバグ検出
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

// ===== 高度なテスト =====

console.log('🔬 高度なモンキーテスト開始\n');
console.log('============================================================\n');

// テスト1: 六角形の隣接関係の正確性
console.log('📝 テスト1: 六角形の隣接関係の検証');
console.log('------------------------------------------------------------');
{
    let hasIssue = false;

    // 各タイルについて、隣接タイルとの相互関係をチェック
    for (let q = 0; q < GRID_COLS; q++) {
        for (let r = 0; r < GRID_ROWS; r++) {
            const neighbors = getNeighbors(q, r);

            // 各隣接タイルについて、逆方向の隣接も成立するかチェック
            neighbors.forEach(neighbor => {
                const reverseNeighbors = getNeighbors(neighbor.q, neighbor.r);
                const isReverse = reverseNeighbors.some(n => n.q === q && n.r === r);

                if (!isReverse) {
                    reportBug(
                        '六角形の隣接関係が非対称',
                        `(${q}, ${r}) は (${neighbor.q}, ${neighbor.r}) を隣接と認識するが、逆は成立しない`,
                        'HIGH'
                    );
                    hasIssue = true;
                }
            });

            // 重複した隣接タイルがないかチェック
            const uniqueNeighbors = new Set(neighbors.map(n => coordKey(n.q, n.r)));
            if (uniqueNeighbors.size !== neighbors.length) {
                reportBug(
                    '隣接タイルに重複がある',
                    `(${q}, ${r}) の隣接タイルリストに重複があります`,
                    'HIGH'
                );
                hasIssue = true;
            }
        }
    }

    if (!hasIssue) {
        console.log('✅ 六角形の隣接関係は正常');
    }
}

// テスト2: グループ検出の包括性（同じグループは同じと認識されるか）
console.log('\n📝 テスト2: グループ検出の一貫性');
console.log('------------------------------------------------------------');
{
    initGrid();
    let hasIssue = false;

    // 全グリッドをスキャンしてグループを検出
    const checked = new Set();
    const groups = [];

    for (const [key, tile] of gameState.tiles) {
        if (checked.has(key)) continue;

        const group = findGroup(tile.q, tile.r);
        group.forEach(t => checked.add(coordKey(t.q, t.r)));
        groups.push(group);
    }

    // 各グループ内の全てのタイルから同じグループが検出されるかチェック
    groups.forEach((group, groupIndex) => {
        const expectedSize = group.length;
        const expectedColor = group[0].color;

        group.forEach(tile => {
            const detectedGroup = findGroup(tile.q, tile.r);

            if (detectedGroup.length !== expectedSize) {
                reportBug(
                    'グループ検出の非一貫性',
                    `グループ ${groupIndex} のタイル (${tile.q}, ${tile.r}) から検出したグループサイズが異なる: 期待 ${expectedSize}, 実際 ${detectedGroup.length}`,
                    'HIGH'
                );
                hasIssue = true;
            }

            // 検出されたグループ内の全タイルが元のグループにも含まれるか
            detectedGroup.forEach(dt => {
                const isInOriginal = group.some(t => t.q === dt.q && t.r === dt.r);
                if (!isInOriginal) {
                    reportBug(
                        'グループ検出に余分なタイルが含まれる',
                        `グループ ${groupIndex} のタイル (${tile.q}, ${tile.r}) から検出したグループに余分なタイル (${dt.q}, ${dt.r}) が含まれる`,
                        'HIGH'
                    );
                    hasIssue = true;
                }
            });
        });
    });

    if (!hasIssue) {
        console.log(`✅ ${groups.length} 個のグループの検出は一貫している`);
    }
}

// テスト3: 重力処理後の物理的妥当性
console.log('\n📝 テスト3: 重力処理の物理的妥当性');
console.log('------------------------------------------------------------');
{
    let hasIssue = false;

    // ランダムなパターンでタイルを削除して重力処理
    for (let iteration = 0; iteration < 50; iteration++) {
        initGrid();

        // ランダムにタイルを削除
        const tilesToRemove = Math.floor(Math.random() * 30) + 1;
        const allTiles = Array.from(gameState.tiles.keys());

        for (let i = 0; i < tilesToRemove && allTiles.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * allTiles.length);
            const keyToRemove = allTiles.splice(randomIndex, 1)[0];
            gameState.tiles.delete(keyToRemove);
        }

        // 重力処理
        applyGravity();

        // 各列で、タイルが下から連続して詰まっているかチェック
        for (let q = 0; q < GRID_COLS; q++) {
            const columnTiles = [];
            for (let r = 0; r < GRID_ROWS; r++) {
                if (gameState.tiles.has(coordKey(q, r))) {
                    columnTiles.push(r);
                }
            }

            if (columnTiles.length > 0) {
                // 最下行から連続しているかチェック
                const expectedStart = GRID_ROWS - columnTiles.length;
                const actualStart = Math.min(...columnTiles);
                const actualEnd = Math.max(...columnTiles);

                if (actualStart !== expectedStart) {
                    reportBug(
                        '重力処理後にタイルが最下行から始まっていない',
                        `イテレーション ${iteration + 1}, 列 ${q}: 期待開始行 ${expectedStart}, 実際 ${actualStart}`,
                        'HIGH'
                    );
                    hasIssue = true;
                }

                if (actualEnd !== GRID_ROWS - 1) {
                    reportBug(
                        '重力処理後にタイルが最下行まで到達していない',
                        `イテレーション ${iteration + 1}, 列 ${q}: 最下行は ${GRID_ROWS - 1} だが、実際の最大行は ${actualEnd}`,
                        'HIGH'
                    );
                    hasIssue = true;
                }

                // 連続性をチェック
                for (let i = 0; i < columnTiles.length; i++) {
                    const expectedR = expectedStart + i;
                    if (!columnTiles.includes(expectedR)) {
                        reportBug(
                            '重力処理後にタイルに隙間がある',
                            `イテレーション ${iteration + 1}, 列 ${q}, 行 ${expectedR} に隙間`,
                            'HIGH'
                        );
                        hasIssue = true;
                        break;
                    }
                }
            }
        }
    }

    if (!hasIssue) {
        console.log('✅ 50回の重力処理テストで物理的妥当性を確認');
    }
}

// テスト4: グループ検出のパフォーマンス（無限ループの検出）
console.log('\n📝 テスト4: グループ検出のパフォーマンステスト');
console.log('------------------------------------------------------------');
{
    // 最悪ケース: 全タイル同色
    gameState.tiles.clear();
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let q = 0; q < GRID_COLS; q++) {
            gameState.tiles.set(coordKey(q, r), { q, r, color: 0 });
        }
    }

    const startTime = Date.now();
    const group = findGroup(0, 0);
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`   全タイル同色のグループ検出: ${duration}ms`);
    console.log(`   検出されたグループサイズ: ${group.length}`);

    if (group.length !== GRID_COLS * GRID_ROWS) {
        reportBug(
            '全タイル同色でグループサイズが不正',
            `全タイル同色なのに、グループサイズが ${group.length} (期待: ${GRID_COLS * GRID_ROWS})`,
            'HIGH'
        );
    }

    if (duration > 1000) {
        reportBug(
            'グループ検出が遅い',
            `全タイル同色のグループ検出に ${duration}ms かかりました（無限ループの可能性）`,
            'MEDIUM'
        );
    } else {
        console.log('✅ パフォーマンステスト合格');
    }
}

// テスト5: タイルの色の整合性
console.log('\n📝 テスト5: タイルの色の整合性');
console.log('------------------------------------------------------------');
{
    initGrid();
    let hasIssue = false;

    for (const [key, tile] of gameState.tiles) {
        if (tile.color < 0 || tile.color >= NUM_COLORS) {
            reportBug(
                'タイルの色が範囲外',
                `タイル (${tile.q}, ${tile.r}) の色が範囲外: ${tile.color} (有効範囲: 0-${NUM_COLORS - 1})`,
                'HIGH'
            );
            hasIssue = true;
        }

        if (!Number.isInteger(tile.color)) {
            reportBug(
                'タイルの色が整数でない',
                `タイル (${tile.q}, ${tile.r}) の色が整数でない: ${tile.color}`,
                'HIGH'
            );
            hasIssue = true;
        }
    }

    if (!hasIssue) {
        console.log('✅ 全タイルの色が有効範囲内');
    }
}

// テスト6: coordKeyの一意性と可逆性
console.log('\n📝 テスト6: 座標キーの一意性と可逆性');
console.log('------------------------------------------------------------');
{
    let hasIssue = false;
    const keys = new Set();

    for (let q = 0; q < GRID_COLS; q++) {
        for (let r = 0; r < GRID_ROWS; r++) {
            const key = coordKey(q, r);

            if (keys.has(key)) {
                reportBug(
                    '座標キーが重複',
                    `座標 (${q}, ${r}) のキー "${key}" が重複しています`,
                    'HIGH'
                );
                hasIssue = true;
            }
            keys.add(key);

            // キーから座標を復元してみる
            const [parsedQ, parsedR] = key.split(',').map(Number);
            if (parsedQ !== q || parsedR !== r) {
                reportBug(
                    '座標キーの可逆性エラー',
                    `座標 (${q}, ${r}) のキー "${key}" から復元した座標が不一致: (${parsedQ}, ${parsedR})`,
                    'HIGH'
                );
                hasIssue = true;
            }
        }
    }

    if (!hasIssue) {
        console.log(`✅ ${keys.size} 個の座標キーは全て一意で可逆的`);
    }
}

// テスト7: グループ内の全タイルが実際に隣接しているか
console.log('\n📝 テスト7: グループ内タイルの連結性検証');
console.log('------------------------------------------------------------');
{
    initGrid();
    let hasIssue = false;

    // 全グループをチェック
    const checked = new Set();

    for (const [key, tile] of gameState.tiles) {
        if (checked.has(key)) continue;

        const group = findGroup(tile.q, tile.r);
        group.forEach(t => checked.add(coordKey(t.q, t.r)));

        if (group.length === 1) continue; // 孤立タイルはスキップ

        // グループ内の各タイルが、少なくとも1つの同グループタイルと隣接しているか
        group.forEach(groupTile => {
            const neighbors = getNeighbors(groupTile.q, groupTile.r);
            const hasAdjacentInGroup = neighbors.some(neighbor => {
                return group.some(gt => gt.q === neighbor.q && gt.r === neighbor.r);
            });

            if (!hasAdjacentInGroup) {
                reportBug(
                    'グループ内の孤立タイル',
                    `タイル (${groupTile.q}, ${groupTile.r}) はグループに含まれるが、グループ内の他のタイルと隣接していない`,
                    'HIGH'
                );
                hasIssue = true;
            }
        });

        // グループ全体が連結しているかBFSで確認
        const visited = new Set();
        const queue = [group[0]];

        while (queue.length > 0) {
            const current = queue.shift();
            const key = coordKey(current.q, current.r);

            if (visited.has(key)) continue;
            visited.add(key);

            const neighbors = getNeighbors(current.q, current.r);
            neighbors.forEach(neighbor => {
                const isInGroup = group.some(gt => gt.q === neighbor.q && gt.r === neighbor.r);
                const neighborKey = coordKey(neighbor.q, neighbor.r);

                if (isInGroup && !visited.has(neighborKey)) {
                    queue.push(neighbor);
                }
            });
        }

        if (visited.size !== group.length) {
            reportBug(
                'グループが非連結',
                `グループサイズ ${group.length} だが、連結成分は ${visited.size} 個のタイルのみ`,
                'HIGH'
            );
            hasIssue = true;
        }
    }

    if (!hasIssue) {
        console.log('✅ 全グループが正しく連結している');
    }
}

// テスト8: 極端なケースでの動作
console.log('\n📝 テスト8: 極端なケースのテスト');
console.log('------------------------------------------------------------');
{
    let hasIssue = false;

    // ケース1: 空のグリッド
    gameState.tiles.clear();
    applyGravity();
    checkGameOver();

    if (!gameState.gameOver) {
        reportBug(
            '空グリッドでゲームオーバーにならない',
            '空のグリッドでゲームオーバーフラグが立たない',
            'MEDIUM'
        );
        hasIssue = true;
    }

    // ケース2: タイル1個だけ
    gameState.tiles.clear();
    gameState.gameOver = false;
    gameState.tiles.set(coordKey(0, GRID_ROWS - 1), { q: 0, r: GRID_ROWS - 1, color: 0 });
    checkGameOver();

    if (!gameState.gameOver) {
        reportBug(
            'タイル1個でゲームオーバーにならない',
            'タイルが1個だけの場合、ゲームオーバーフラグが立たない',
            'MEDIUM'
        );
        hasIssue = true;
    }

    // ケース3: チェッカーボードパターン（隣接タイルが全て異色）
    gameState.tiles.clear();
    gameState.gameOver = false;
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let q = 0; q < GRID_COLS; q++) {
            const color = (q + r) % NUM_COLORS;
            gameState.tiles.set(coordKey(q, r), { q, r, color });
        }
    }
    checkGameOver();

    // このパターンで実際に隣接タイルが全て異色かチェック
    let allDifferent = true;
    for (const [key, tile] of gameState.tiles) {
        const neighbors = getNeighbors(tile.q, tile.r);
        for (const neighbor of neighbors) {
            const neighborTile = gameState.tiles.get(coordKey(neighbor.q, neighbor.r));
            if (neighborTile && neighborTile.color === tile.color) {
                allDifferent = false;
                break;
            }
        }
        if (!allDifferent) break;
    }

    if (allDifferent && !gameState.gameOver) {
        reportBug(
            '全タイル異色でゲームオーバーにならない',
            'チェッカーボードパターン（全隣接タイルが異色）でゲームオーバーフラグが立たない',
            'HIGH'
        );
        hasIssue = true;
    } else if (allDifferent) {
        console.log('✅ チェッカーボードパターンで正しくゲームオーバー');
    } else {
        console.log('⚠️  チェッカーボードパターンに同色の隣接タイルが存在（テストパターンの問題）');
    }

    if (!hasIssue) {
        console.log('✅ 極端なケースのテスト合格');
    }
}

// ===== 結果レポート =====

console.log('\n============================================================');
console.log('📊 高度なモンキーテスト結果');
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
            console.log(`${i + 1}. ${bug.title}`);
            console.log(`   ${bug.description}`);
        });
    }

    if (mediumSeverity.length > 0) {
        console.log('\n🟡 MEDIUM SEVERITY:');
        mediumSeverity.forEach((bug, i) => {
            console.log(`${i + 1}. ${bug.title}`);
            console.log(`   ${bug.description}`);
        });
    }

    console.log('\n============================================================');
    process.exit(1);
} else {
    console.log('🎉 バグは検出されませんでした！\n');
    process.exit(0);
}
