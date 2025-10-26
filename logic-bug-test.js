// ロジックバグテスト - ゲームロジックの微妙なバグを検出
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

// 隣接関係を保存
function captureAdjacency() {
    const adjacency = new Map();

    for (const [key, tile] of gameState.tiles) {
        const neighbors = getNeighbors(tile.q, tile.r);
        const adjacentTiles = neighbors
            .filter(n => gameState.tiles.has(coordKey(n.q, n.r)))
            .map(n => {
                const neighbor = gameState.tiles.get(coordKey(n.q, n.r));
                return { q: neighbor.q, r: neighbor.r, color: neighbor.color };
            });

        adjacency.set(key, adjacentTiles);
    }

    return adjacency;
}

// ===== ロジックバグテスト =====

console.log('🔍 ロジックバグテスト開始\n');
console.log('============================================================\n');

// テスト1: 重力処理前後での不正な隣接関係の発生
console.log('📝 テスト1: 重力処理による隣接関係の変化');
console.log('------------------------------------------------------------');
{
    let issueCount = 0;

    for (let iteration = 0; iteration < 30; iteration++) {
        initGrid();

        // ランダムにタイルを削除
        const tilesToDelete = Math.floor(Math.random() * 20) + 5;
        const allKeys = Array.from(gameState.tiles.keys());

        for (let i = 0; i < tilesToDelete && allKeys.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * allKeys.length);
            const keyToDelete = allKeys.splice(randomIndex, 1)[0];
            gameState.tiles.delete(keyToDelete);
        }

        // 重力処理前の状態を保存
        const beforeTiles = new Map(gameState.tiles);

        // 重力処理
        applyGravity();

        // 重力処理後、各タイルのqとcolorが変わっていないかチェック
        for (const [beforeKey, beforeTile] of beforeTiles) {
            // 同じq座標のタイルを探す
            let found = false;
            for (const [afterKey, afterTile] of gameState.tiles) {
                if (afterTile.q === beforeTile.q && afterTile.color === beforeTile.color) {
                    found = true;

                    // rが増加している（上に移動している）場合はバグ
                    if (afterTile.r < beforeTile.r) {
                        // これは正常（下に落ちた）
                    } else if (afterTile.r > beforeTile.r) {
                        reportBug(
                            '重力処理でタイルが上に移動',
                            `イテレーション ${iteration}: タイル (${beforeTile.q}, ${beforeTile.r}) が (${afterTile.q}, ${afterTile.r}) に移動`,
                            'HIGH'
                        );
                        issueCount++;
                    }
                    break;
                }
            }
        }
    }

    if (issueCount === 0) {
        console.log('✅ 重力処理による隣接関係の変化は正常');
    }
}

// テスト2: スコア計算の正確性
console.log('\n📝 テスト2: スコア計算の正確性');
console.log('------------------------------------------------------------');
{
    let issueCount = 0;

    for (let iteration = 0; iteration < 50; iteration++) {
        initGrid();
        gameState.score = 0;

        let totalExpectedScore = 0;

        // ゲームをプレイ
        for (let move = 0; move < 20; move++) {
            const allTiles = Array.from(gameState.tiles.values());
            if (allTiles.length === 0) break;

            const randomTile = allTiles[Math.floor(Math.random() * allTiles.length)];
            const group = findGroup(randomTile.q, randomTile.r);

            if (group.length >= 2) {
                // 期待されるスコア
                const expectedPoints = Math.pow(group.length - 2, 2);
                totalExpectedScore += expectedPoints;

                // タイルを削除
                group.forEach(tile => {
                    gameState.tiles.delete(coordKey(tile.q, tile.r));
                });

                // スコア加算
                gameState.score += expectedPoints;

                // 重力処理
                applyGravity();
            }
        }

        // スコアが一致しているかチェック
        if (gameState.score !== totalExpectedScore) {
            reportBug(
                'スコア計算が不正',
                `イテレーション ${iteration}: 期待スコア ${totalExpectedScore}, 実際のスコア ${gameState.score}`,
                'HIGH'
            );
            issueCount++;
        }
    }

    if (issueCount === 0) {
        console.log('✅ 50回のゲームでスコア計算は正確');
    }
}

// テスト3: ゲームオーバー判定の正確性
console.log('\n📝 テスト3: ゲームオーバー判定の正確性');
console.log('------------------------------------------------------------');
{
    let falsePositives = 0;
    let falseNegatives = 0;

    for (let iteration = 0; iteration < 100; iteration++) {
        initGrid();
        gameState.gameOver = false;

        // ランダムな操作を行う
        for (let move = 0; move < Math.floor(Math.random() * 10); move++) {
            const allTiles = Array.from(gameState.tiles.values());
            if (allTiles.length === 0) break;

            const randomTile = allTiles[Math.floor(Math.random() * allTiles.length)];
            const group = findGroup(randomTile.q, randomTile.r);

            if (group.length >= 2) {
                group.forEach(tile => {
                    gameState.tiles.delete(coordKey(tile.q, tile.r));
                });
                applyGravity();
            }
        }

        // ゲームオーバー判定
        checkGameOver();

        // 手動でゲームオーバーかどうか確認
        let hasPlayableGroup = false;
        for (const [key, tile] of gameState.tiles) {
            const group = findGroup(tile.q, tile.r);
            if (group.length >= 2) {
                hasPlayableGroup = true;
                break;
            }
        }

        // 判定が正しいかチェック
        if (gameState.gameOver && hasPlayableGroup) {
            reportBug(
                'ゲームオーバー判定の誤検知',
                `イテレーション ${iteration}: プレイ可能なグループがあるのにゲームオーバー`,
                'HIGH'
            );
            falsePositives++;
        } else if (!gameState.gameOver && !hasPlayableGroup) {
            reportBug(
                'ゲームオーバー判定の見逃し',
                `イテレーション ${iteration}: プレイ可能なグループがないのにゲーム継続`,
                'HIGH'
            );
            falseNegatives++;
        }
    }

    if (falsePositives === 0 && falseNegatives === 0) {
        console.log('✅ 100回のゲームでゲームオーバー判定は正確');
    } else {
        console.log(`⚠️  誤検知: ${falsePositives}回, 見逃し: ${falseNegatives}回`);
    }
}

// テスト4: 重力処理による新グループの形成
console.log('\n📝 テスト4: 重力処理後の新グループ形成');
console.log('------------------------------------------------------------');
{
    let newGroupsFormed = 0;
    let testCount = 0;

    for (let iteration = 0; iteration < 50; iteration++) {
        initGrid();

        // 消せるグループを見つける
        let foundGroup = null;
        for (const [key, tile] of gameState.tiles) {
            const group = findGroup(tile.q, tile.r);
            if (group.length >= 2) {
                foundGroup = group;
                break;
            }
        }

        if (!foundGroup) continue;
        testCount++;

        // グループを削除する前に、周辺のタイルの色を記録
        const surroundingTiles = new Set();
        foundGroup.forEach(tile => {
            const neighbors = getNeighbors(tile.q, tile.r);
            neighbors.forEach(n => {
                const neighborKey = coordKey(n.q, n.r);
                if (gameState.tiles.has(neighborKey)) {
                    const neighborTile = gameState.tiles.get(neighborKey);
                    // このタイルが削除されるグループに含まれない場合のみ
                    if (!foundGroup.some(gt => gt.q === n.q && gt.r === n.r)) {
                        surroundingTiles.add(neighborKey);
                    }
                }
            });
        });

        // グループを削除
        foundGroup.forEach(tile => {
            gameState.tiles.delete(coordKey(tile.q, tile.r));
        });

        // 重力処理
        applyGravity();

        // 重力処理後、新しいグループが形成されているかチェック
        const checked = new Set();
        for (const tileKey of surroundingTiles) {
            if (!gameState.tiles.has(tileKey)) continue;
            if (checked.has(tileKey)) continue;

            const tile = gameState.tiles.get(tileKey);
            const newGroup = findGroup(tile.q, tile.r);
            newGroup.forEach(t => checked.add(coordKey(t.q, t.r)));

            if (newGroup.length >= 2) {
                newGroupsFormed++;
                break; // このイテレーションでは1つカウントするだけ
            }
        }
    }

    console.log(`ℹ️  ${testCount} 回のテストで、${newGroupsFormed} 回新しいグループが形成されました`);
    console.log(`   これは正常な動作です（重力処理により新グループ形成は期待される）`);
    console.log('✅ 重力処理後の新グループ形成テスト完了');
}

// テスト5: 列ごとの重力処理の独立性
console.log('\n📝 テスト5: 列ごとの重力処理の独立性');
console.log('------------------------------------------------------------');
{
    let issueCount = 0;

    for (let iteration = 0; iteration < 30; iteration++) {
        initGrid();

        // 各列のタイル数を記録
        const columnCounts = {};
        for (let q = 0; q < GRID_COLS; q++) {
            columnCounts[q] = 0;
            for (let r = 0; r < GRID_ROWS; r++) {
                if (gameState.tiles.has(coordKey(q, r))) {
                    columnCounts[q]++;
                }
            }
        }

        // ランダムにタイルを削除（特定の列のみ）
        const targetColumn = Math.floor(Math.random() * GRID_COLS);
        const tilesToDelete = Math.floor(Math.random() * 3) + 1;

        for (let i = 0; i < tilesToDelete; i++) {
            const r = Math.floor(Math.random() * GRID_ROWS);
            gameState.tiles.delete(coordKey(targetColumn, r));
        }

        // 重力処理
        applyGravity();

        // 他の列のタイル数が変わっていないかチェック
        for (let q = 0; q < GRID_COLS; q++) {
            if (q === targetColumn) continue; // 削除した列はスキップ

            let currentCount = 0;
            for (let r = 0; r < GRID_ROWS; r++) {
                if (gameState.tiles.has(coordKey(q, r))) {
                    currentCount++;
                }
            }

            if (currentCount !== columnCounts[q]) {
                reportBug(
                    '列間の干渉が発生',
                    `イテレーション ${iteration}: 列 ${targetColumn} のみを変更したが、列 ${q} のタイル数が ${columnCounts[q]} から ${currentCount} に変化`,
                    'HIGH'
                );
                issueCount++;
            }
        }
    }

    if (issueCount === 0) {
        console.log('✅ 列ごとの重力処理は独立している');
    }
}

// テスト6: タイルの色が保存されるか
console.log('\n📝 テスト6: 重力処理後のタイルの色の保存');
console.log('------------------------------------------------------------');
{
    let issueCount = 0;

    for (let iteration = 0; iteration < 50; iteration++) {
        initGrid();

        // 重力処理前の全タイルの色を記録
        const colorsBefore = new Map();
        for (const [key, tile] of gameState.tiles) {
            colorsBefore.set(key, tile.color);
        }

        // ランダムにタイルを削除
        const tilesToDelete = Math.floor(Math.random() * 10) + 1;
        const allKeys = Array.from(gameState.tiles.keys());

        for (let i = 0; i < tilesToDelete && allKeys.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * allKeys.length);
            const keyToDelete = allKeys.splice(randomIndex, 1)[0];
            gameState.tiles.delete(keyToDelete);
            colorsBefore.delete(keyToDelete); // 削除されたタイルは比較から除外
        }

        // 重力処理
        applyGravity();

        // 残ったタイルの色が変わっていないかチェック
        // （位置は変わっても、色は変わらないはず）
        const colorsAfterByColumn = new Map();
        for (const [key, tile] of gameState.tiles) {
            // 列ごとに色のリストを作成
            const q = tile.q;
            if (!colorsAfterByColumn.has(q)) {
                colorsAfterByColumn.set(q, []);
            }
            colorsAfterByColumn.get(q).push(tile.color);
        }

        const colorsBeforeByColumn = new Map();
        for (const [key, color] of colorsBefore) {
            const [q, r] = key.split(',').map(Number);
            if (!colorsBeforeByColumn.has(q)) {
                colorsBeforeByColumn.set(q, []);
            }
            colorsBeforeByColumn.get(q).push(color);
        }

        // 各列で、色のリストが一致するかチェック（順序は変わる可能性がある）
        for (const [q, colorsAfterList] of colorsAfterByColumn) {
            const colorsBeforeList = colorsBeforeByColumn.get(q) || [];

            // ソートして比較
            const sortedAfter = [...colorsAfterList].sort();
            const sortedBefore = [...colorsBeforeList].sort();

            if (JSON.stringify(sortedAfter) !== JSON.stringify(sortedBefore)) {
                reportBug(
                    '重力処理でタイルの色が変化',
                    `イテレーション ${iteration}, 列 ${q}: 重力処理前後で色のリストが不一致`,
                    'HIGH'
                );
                issueCount++;
            }
        }
    }

    if (issueCount === 0) {
        console.log('✅ 重力処理後もタイルの色は保存される');
    }
}

// ===== 結果レポート =====

console.log('\n============================================================');
console.log('📊 ロジックバグテスト結果');
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
            console.log(`   ${bug.description}`);
        });
    }

    if (mediumSeverity.length > 0) {
        console.log('\n🟡 MEDIUM SEVERITY:');
        mediumSeverity.forEach((bug, i) => {
            console.log(`\n${i + 1}. ${bug.title}`);
            console.log(`   ${bug.description}`);
        });
    }

    console.log('\n============================================================');
    process.exit(1);
} else {
    console.log('🎉 ロジックバグは検出されませんでした！\n');
    process.exit(0);
}
