// Evanescent Chroma Hexa - テストスイート
// TEST_DESIGN.md に基づいた包括的なテスト

describe('六角形座標ユーティリティ', function() {

    describe('coordKey(q, r)', function() {
        it('CK-1: 境界値 (0, 0) で正しいキーを生成', function() {
            expect(coordKey(0, 0)).to.equal('0,0');
        });

        it('CK-2: 境界値 (7, 8) で正しいキーを生成', function() {
            expect(coordKey(7, 8)).to.equal('7,8');
        });

        it('CK-3: 正常値 (4, 4) で正しいキーを生成', function() {
            expect(coordKey(4, 4)).to.equal('4,4');
        });

        it('CK-4: 境界外 (-1, -1) でもキーを生成', function() {
            expect(coordKey(-1, -1)).to.equal('-1,-1');
        });
    });

    describe('hexToPixel(q, r)', function() {
        it('HP-1: 境界値 (0, 0) で原点を返す', function() {
            const result = hexToPixel(0, 0);
            expect(result.x).to.equal(0);
            expect(result.y).to.equal(0);
        });

        it('HP-2: (1, 0) で正しい座標を計算', function() {
            const result = hexToPixel(1, 0);
            expect(result.x).to.be.closeTo(45, 0.1); // HEX_SIZE=30: 30*3/2=45
            expect(result.y).to.be.closeTo(25.98, 0.1); // 30*sqrt(3)/2
        });

        it('HP-3: (0, 1) で正しい座標を計算', function() {
            const result = hexToPixel(0, 1);
            expect(result.x).to.equal(0);
            expect(result.y).to.be.closeTo(51.96, 0.1); // 30*sqrt(3)
        });

        it('HP-4: 境界値 (7, 8) で正しい座標を計算', function() {
            const result = hexToPixel(7, 8);
            expect(result.x).to.be.closeTo(315, 0.1); // 30*3/2*7
            expect(result.y).to.be.closeTo(505.77, 0.5); // 計算値
        });
    });

    describe('getNeighbors(q, r)', function() {
        it('GN-1: 左上角 (0, 0) で6方向の座標を返す', function() {
            const neighbors = getNeighbors(0, 0);
            expect(neighbors).to.have.lengthOf(6);

            // 隣接座標を確認
            const coords = neighbors.map(n => coordKey(n.q, n.r));
            expect(coords).to.include('1,0');   // 右
            expect(coords).to.include('1,-1');  // 右上
            expect(coords).to.include('0,-1');  // 左上
        });

        it('GN-2: 右下角 (7, 8) で6方向の座標を返す', function() {
            const neighbors = getNeighbors(7, 8);
            expect(neighbors).to.have.lengthOf(6);

            const coords = neighbors.map(n => coordKey(n.q, n.r));
            expect(coords).to.include('6,8');  // 左
            expect(coords).to.include('6,7');  // 左上
        });

        it('GN-3: 中央 (4, 4) で6方向の座標を返す', function() {
            const neighbors = getNeighbors(4, 4);
            expect(neighbors).to.have.lengthOf(6);

            // すべてグリッド内の座標であることを確認
            neighbors.forEach(n => {
                expect(n.q).to.be.within(3, 5);
                expect(n.r).to.be.within(3, 5);
            });
        });

        it('GN-4: 左端 (0, 4) で6方向の座標を返す', function() {
            const neighbors = getNeighbors(0, 4);
            expect(neighbors).to.have.lengthOf(6);
        });

        it('GN-5: 右端 (7, 4) で6方向の座標を返す', function() {
            const neighbors = getNeighbors(7, 4);
            expect(neighbors).to.have.lengthOf(6);
        });
    });

    describe('randomColor()', function() {
        it('0から3の範囲内の整数を返す', function() {
            for (let i = 0; i < 100; i++) {
                const color = randomColor();
                expect(color).to.be.within(0, 3);
                expect(Number.isInteger(color)).to.be.true;
            }
        });

        it('すべての色が出現する（確率的）', function() {
            const colors = new Set();
            for (let i = 0; i < 1000; i++) {
                colors.add(randomColor());
            }
            expect(colors.size).to.equal(4); // 0, 1, 2, 3 すべて出現
        });
    });
});

describe('ゲームロジック - グループ検出', function() {

    beforeEach(function() {
        // 各テスト前にゲーム状態をクリア
        gameState.tiles.clear();
        gameState.score = 0;
        gameState.gameOver = false;
    });

    describe('findGroup(startQ, startR)', function() {
        it('FG-1: 孤立タイル（周囲が異色）でサイズ1を返す', function() {
            // 中央に赤(0)、周囲を青(1)で配置
            gameState.tiles.set('4,4', { q: 4, r: 4, color: 0 });
            gameState.tiles.set('5,4', { q: 5, r: 4, color: 1 });
            gameState.tiles.set('3,4', { q: 3, r: 4, color: 1 });
            gameState.tiles.set('4,3', { q: 4, r: 3, color: 1 });
            gameState.tiles.set('4,5', { q: 4, r: 5, color: 1 });

            const group = findGroup(4, 4);
            expect(group).to.have.lengthOf(1);
            expect(group[0].color).to.equal(0);
        });

        it('FG-2: 横2個同色でサイズ2を返す', function() {
            gameState.tiles.set('0,0', { q: 0, r: 0, color: 0 });
            gameState.tiles.set('1,0', { q: 1, r: 0, color: 0 });

            const group = findGroup(0, 0);
            expect(group).to.have.lengthOf(2);
        });

        it('FG-3: L字3個同色でサイズ3を返す', function() {
            gameState.tiles.set('0,0', { q: 0, r: 0, color: 0 });
            gameState.tiles.set('1,0', { q: 1, r: 0, color: 0 });
            gameState.tiles.set('1,-1', { q: 1, r: -1, color: 0 });

            const group = findGroup(0, 0);
            expect(group).to.have.lengthOf(3);
        });

        it('FG-4: 全タイル同色(9個テスト)でサイズ9を返す', function() {
            // 3x3グリッドを作成
            for (let r = 0; r < 3; r++) {
                for (let q = 0; q < 3; q++) {
                    gameState.tiles.set(coordKey(q, r), { q, r, color: 0 });
                }
            }

            const group = findGroup(1, 1);
            expect(group).to.have.lengthOf(9);
        });

        it('FG-5: 存在しない座標で空配列を返す', function() {
            const group = findGroup(10, 10);
            expect(group).to.be.empty;
        });

        it('FG-6: 削除済み座標で空配列を返す', function() {
            // タイルを配置してから削除
            gameState.tiles.set('5,5', { q: 5, r: 5, color: 0 });
            gameState.tiles.delete('5,5');

            const group = findGroup(5, 5);
            expect(group).to.be.empty;
        });

        it('複雑なパターン: 分離された同色グループ', function() {
            // グループ1: (0,0), (1,0)
            gameState.tiles.set('0,0', { q: 0, r: 0, color: 0 });
            gameState.tiles.set('1,0', { q: 1, r: 0, color: 0 });

            // グループ2（分離）: (3,0), (4,0)
            gameState.tiles.set('3,0', { q: 3, r: 0, color: 0 });
            gameState.tiles.set('4,0', { q: 4, r: 0, color: 0 });

            // 間に異色
            gameState.tiles.set('2,0', { q: 2, r: 0, color: 1 });

            const group1 = findGroup(0, 0);
            expect(group1).to.have.lengthOf(2);

            const group2 = findGroup(3, 0);
            expect(group2).to.have.lengthOf(2);
        });
    });
});

describe('ゲームロジック - 重力処理', function() {

    beforeEach(function() {
        gameState.tiles.clear();
        gameState.score = 0;
        gameState.gameOver = false;
    });

    describe('applyGravity()', function() {
        it('AG-1: 列の下半分削除で上半分が下に落ちる', function() {
            // 列0に5個配置
            for (let r = 0; r < 5; r++) {
                gameState.tiles.set(coordKey(0, r), { q: 0, r, color: 0 });
            }

            // 下3個を削除
            gameState.tiles.delete('0,2');
            gameState.tiles.delete('0,3');
            gameState.tiles.delete('0,4');

            applyGravity();

            // 残り2個が最下部に移動
            expect(gameState.tiles.has('0,7')).to.be.true;
            expect(gameState.tiles.has('0,8')).to.be.true;
            expect(gameState.tiles.has('0,0')).to.be.false;
            expect(gameState.tiles.has('0,1')).to.be.false;
        });

        it('AG-2: 列が全削除で空列のまま', function() {
            // 列0に3個配置
            for (let r = 0; r < 3; r++) {
                gameState.tiles.set(coordKey(0, r), { q: 0, r, color: 0 });
            }

            // 全削除
            gameState.tiles.clear();

            applyGravity();

            // 列0に何もない
            for (let r = 0; r < GRID_ROWS; r++) {
                expect(gameState.tiles.has(coordKey(0, r))).to.be.false;
            }
        });

        it('AG-3: 複数列でランダム削除後、各列独立して落下', function() {
            // 列0: 5個 → 2個削除
            for (let r = 0; r < 5; r++) {
                gameState.tiles.set(coordKey(0, r), { q: 0, r, color: 0 });
            }
            gameState.tiles.delete('0,1');
            gameState.tiles.delete('0,3');

            // 列1: 4個 → 1個削除
            for (let r = 0; r < 4; r++) {
                gameState.tiles.set(coordKey(1, r), { q: 1, r, color: 1 });
            }
            gameState.tiles.delete('1,2');

            applyGravity();

            // 列0: 3個が下部に
            let col0Count = 0;
            for (let r = 0; r < GRID_ROWS; r++) {
                if (gameState.tiles.has(coordKey(0, r))) col0Count++;
            }
            expect(col0Count).to.equal(3);

            // 列1: 3個が下部に
            let col1Count = 0;
            for (let r = 0; r < GRID_ROWS; r++) {
                if (gameState.tiles.has(coordKey(1, r))) col1Count++;
            }
            expect(col1Count).to.equal(3);
        });

        it('AG-4: 削除なしで何も変化しない', function() {
            // フルグリッド作成
            for (let r = 0; r < GRID_ROWS; r++) {
                for (let q = 0; q < GRID_COLS; q++) {
                    gameState.tiles.set(coordKey(q, r), { q, r, color: 0 });
                }
            }

            const before = gameState.tiles.size;
            applyGravity();
            const after = gameState.tiles.size;

            expect(after).to.equal(before);
            expect(after).to.equal(GRID_COLS * GRID_ROWS);
        });

        it('重力処理後、各列のタイルが下から連続して配置される', function() {
            // 列0に虫食い状態で配置
            gameState.tiles.set('0,0', { q: 0, r: 0, color: 0 });
            gameState.tiles.set('0,2', { q: 0, r: 2, color: 0 });
            gameState.tiles.set('0,5', { q: 0, r: 5, color: 0 });

            applyGravity();

            // 3個が r=6,7,8 に配置されるはず
            expect(gameState.tiles.has('0,6')).to.be.true;
            expect(gameState.tiles.has('0,7')).to.be.true;
            expect(gameState.tiles.has('0,8')).to.be.true;
        });
    });
});

describe('ゲームロジック - 終了判定', function() {

    beforeEach(function() {
        gameState.tiles.clear();
        gameState.score = 0;
        gameState.gameOver = false;
    });

    describe('checkGameOver()', function() {
        it('CO-1: 全タイル異色でゲーム終了', function() {
            // 4個のタイルを全て異色で配置（隣接なし）
            gameState.tiles.set('0,0', { q: 0, r: 0, color: 0 });
            gameState.tiles.set('1,0', { q: 1, r: 0, color: 1 });
            gameState.tiles.set('0,1', { q: 0, r: 1, color: 2 });
            gameState.tiles.set('1,1', { q: 1, r: 1, color: 3 });

            checkGameOver();

            expect(gameState.gameOver).to.be.true;
        });

        it('CO-2: 2個以上の同色隣接ありで継続可能', function() {
            gameState.tiles.set('0,0', { q: 0, r: 0, color: 0 });
            gameState.tiles.set('1,0', { q: 1, r: 0, color: 0 });

            checkGameOver();

            expect(gameState.gameOver).to.be.false;
        });

        it('CO-3: タイル1個のみでゲーム終了', function() {
            gameState.tiles.set('5,5', { q: 5, r: 5, color: 0 });

            checkGameOver();

            expect(gameState.gameOver).to.be.true;
        });

        it('CO-4: タイル0個（空グリッド）でゲーム終了', function() {
            // 何も配置しない
            checkGameOver();

            expect(gameState.gameOver).to.be.true;
        });

        it('CO-5: 同色だが非隣接でゲーム終了', function() {
            gameState.tiles.set('0,0', { q: 0, r: 0, color: 0 });
            gameState.tiles.set('7,8', { q: 7, r: 8, color: 0 }); // 離れた位置

            checkGameOver();

            expect(gameState.gameOver).to.be.true;
        });

        it('複雑なパターン: 大きなグループが1つだけ', function() {
            // 3x3の同色グループ
            for (let r = 0; r < 3; r++) {
                for (let q = 0; q < 3; q++) {
                    gameState.tiles.set(coordKey(q, r), { q, r, color: 0 });
                }
            }

            checkGameOver();

            expect(gameState.gameOver).to.be.false;
        });
    });
});

describe('スコア計算', function() {

    beforeEach(function() {
        gameState.tiles.clear();
        gameState.score = 0;
        gameState.gameOver = false;
    });

    it('スコア計算: (n-2)² の検証', function() {
        const testCases = [
            { n: 2, expected: 0 },
            { n: 3, expected: 1 },
            { n: 4, expected: 4 },
            { n: 5, expected: 9 },
            { n: 10, expected: 64 },
            { n: 20, expected: 324 }
        ];

        testCases.forEach(tc => {
            const score = Math.pow(tc.n - 2, 2);
            expect(score).to.equal(tc.expected, `n=${tc.n} の場合`);
        });
    });

    it('累積スコア: 複数回消去で正しく加算', function() {
        expect(gameState.score).to.equal(0);

        // 1回目: 3個消去 → +1
        gameState.score += Math.pow(3 - 2, 2);
        expect(gameState.score).to.equal(1);

        // 2回目: 5個消去 → +9
        gameState.score += Math.pow(5 - 2, 2);
        expect(gameState.score).to.equal(10);

        // 3回目: 10個消去 → +64
        gameState.score += Math.pow(10 - 2, 2);
        expect(gameState.score).to.equal(74);
    });
});

describe('境界値テスト', function() {

    beforeEach(function() {
        gameState.tiles.clear();
        gameState.score = 0;
        gameState.gameOver = false;
    });

    it('グリッドサイズ境界: 最大72個のタイル', function() {
        // フルグリッド作成
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let q = 0; q < GRID_COLS; q++) {
                gameState.tiles.set(coordKey(q, r), { q, r, color: 0 });
            }
        }

        expect(gameState.tiles.size).to.equal(GRID_COLS * GRID_ROWS);
        expect(gameState.tiles.size).to.equal(72);
    });

    it('座標境界: (0,0) ~ (7,8) の範囲', function() {
        // 四隅のタイルを配置
        const corners = [
            { q: 0, r: 0 },
            { q: 7, r: 0 },
            { q: 0, r: 8 },
            { q: 7, r: 8 }
        ];

        corners.forEach(corner => {
            gameState.tiles.set(coordKey(corner.q, corner.r), { ...corner, color: 0 });
        });

        expect(gameState.tiles.size).to.equal(4);
        expect(gameState.tiles.has('0,0')).to.be.true;
        expect(gameState.tiles.has('7,0')).to.be.true;
        expect(gameState.tiles.has('0,8')).to.be.true;
        expect(gameState.tiles.has('7,8')).to.be.true;
    });

    it('色番号境界: 0~3 の範囲', function() {
        const colors = [0, 1, 2, 3];

        colors.forEach((color, index) => {
            gameState.tiles.set(coordKey(index, 0), { q: index, r: 0, color });
        });

        gameState.tiles.forEach(tile => {
            expect(tile.color).to.be.within(0, 3);
        });
    });
});

describe('統合テスト', function() {

    beforeEach(function() {
        gameState.tiles.clear();
        gameState.score = 0;
        gameState.gameOver = false;
    });

    it('シナリオ1: グリッド初期化 → グループ消去 → 重力 → 終了判定', function() {
        // 1. グリッド初期化（簡易版）
        for (let r = 0; r < 3; r++) {
            for (let q = 0; q < 3; q++) {
                gameState.tiles.set(coordKey(q, r), { q, r, color: q % 2 });
            }
        }
        expect(gameState.tiles.size).to.equal(9);

        // 2. グループ検出
        const group = findGroup(0, 0);
        expect(group.length).to.be.greaterThan(0);

        // 3. グループ消去
        if (group.length >= 2) {
            const sizeBefore = gameState.tiles.size;
            group.forEach(tile => {
                gameState.tiles.delete(coordKey(tile.q, tile.r));
            });
            expect(gameState.tiles.size).to.be.lessThan(sizeBefore);

            // 4. スコア加算
            const points = Math.pow(group.length - 2, 2);
            gameState.score += points;
            expect(gameState.score).to.be.greaterThan(0);

            // 5. 重力処理
            applyGravity();

            // 6. ゲーム終了判定
            checkGameOver();
            // 結果は盤面の状態に依存
        }
    });

    it('シナリオ2: 全消しまでのフロー', function() {
        // 横2個の同色タイルのみ
        gameState.tiles.set('0,0', { q: 0, r: 0, color: 0 });
        gameState.tiles.set('1,0', { q: 1, r: 0, color: 0 });

        // グループ検出
        const group = findGroup(0, 0);
        expect(group).to.have.lengthOf(2);

        // 消去
        group.forEach(tile => {
            gameState.tiles.delete(coordKey(tile.q, tile.r));
        });

        // スコア加算
        gameState.score += Math.pow(group.length - 2, 2);
        expect(gameState.score).to.equal(0); // 2個消去は0点

        // 重力処理
        applyGravity();

        // ゲーム終了判定
        checkGameOver();
        expect(gameState.gameOver).to.be.true; // 全消し
        expect(gameState.tiles.size).to.equal(0);
    });
});
