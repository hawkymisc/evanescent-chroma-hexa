# Evanescent Chroma Hexa

[English](#english) | [日本語](#日本語)

---

## English

A color-matching puzzle game played on a hexagonal grid.

### 🎮 How to Play

1. Open `index.html` in your browser
2. Click on 2 or more adjacent tiles of the same color
3. Tiles disappear and you score points!
4. Game ends when no more tiles can be removed

### 🎯 Rules

- **Remove Condition**: Groups of 2 or more adjacent tiles of the same color
- **Score Calculation**: `(number of tiles - 2)²`
  - 2 tiles: 0 points
  - 3 tiles: 1 point
  - 4 tiles: 4 points
  - 5 tiles: 9 points
- **Gravity**: After removing tiles, upper tiles fall down
- **Game Over**: Ends when no removable groups remain

### 🛠️ Technical Specifications

- **Vanilla JavaScript** - No build required
- **CSS clip-path** - Hexagon rendering
- **Axial Coordinate System** - Hexagonal grid management
- **GitHub Pages Ready** - Static hosting

### 📁 File Structure

```
/
├── index.html          # Main HTML
├── style.css           # Stylesheet
├── game.js             # Game logic
├── test.html           # Test runner
├── test.js             # Test suite
├── README.md           # This file
├── REQUIREMENTS.md     # Requirements document
├── SPEC.md             # Detailed specifications
└── TEST_DESIGN.md      # Test design document
```

### 🚀 Play Locally

#### Method 1: Direct Open
```bash
# Open directly in browser
open index.html
```

#### Method 2: HTTP Server
```bash
# Python 3
python -m http.server 8000

# Node.js (npx)
npx serve

# Open http://localhost:8000 in browser
```

### 🧪 Running Tests

Comprehensive unit and integration tests are implemented.

#### How to Run Tests

**Method 1: Node.js (Recommended)**
```bash
# Run tests (131 test cases)
npm test

# Or run directly
node test-node.js
```

**Method 2: Browser (Mocha UI)**
```bash
# Start HTTP server
python -m http.server 8000

# Open http://localhost:8000/test.html in browser
```

**Method 3: Monkey Tests (Stress Testing)**
```bash
# Basic monkey test - Random operations
node monkey-test.js

# Advanced monkey test - Hexagonal grid validation
node advanced-monkey-test.js

# Fuzz test - Edge cases and invalid inputs
node fuzz-test.js

# Logic bug test - Game logic verification
node logic-bug-test.js
```

#### Test Coverage

- ✅ **Boundary Value Analysis**: Coordinates, group sizes, score boundaries
- ✅ **State Transition Testing**: Game state and tile state transitions
- ✅ **Unit Tests**: Individual tests for all functions
- ✅ **Integration Tests**: Full game flow testing
- ✅ **Monkey Tests**: Random operations, stress testing, edge cases (hundreds of test cases)
- ✅ **Fuzz Tests**: Invalid inputs, extreme values, malformed data
- ✅ **Logic Verification**: Gravity physics, score accuracy, game over detection

#### Test Suite Details

| Category | Test Cases | Coverage |
|---------|-----------|----------|
| Hexagonal Coordinate Utilities | 12+ | 100% |
| Group Detection (BFS) | 7+ | 100% |
| Gravity Processing | 5+ | 100% |
| Game Over Detection | 6+ | 100% |
| Score Calculation | 2+ | 100% |
| Boundary Value Tests | 3+ | - |
| Integration Tests | 2+ | - |

See [TEST_DESIGN.md](TEST_DESIGN.md) for details.

### 📝 Documentation

- [REQUIREMENTS.md](REQUIREMENTS.md) - MVP requirements
- [SPEC.md](SPEC.md) - Detailed specifications
- [TEST_DESIGN.md](TEST_DESIGN.md) - Test design document

### 🎨 Color Palette

- 🔴 Red: `#FF6B6B`
- 🔵 Blue: `#4ECDC4`
- 🟢 Green: `#95E1D3`
- 🟡 Yellow: `#FFE66D`

### 🧩 Hexagonal Grid Features

- Each tile is adjacent in up to **6 directions** (more strategic than traditional 4 directions)
- Pointy-top orientation (pointed vertex on top)
- 8 columns × 9 rows grid

### 📜 License

MIT License

---

## 日本語

六角形グリッドで遊ぶ、色合わせパズルゲーム。

### 🎮 プレイ方法

1. `index.html` をブラウザで開く
2. 同じ色で隣接する2個以上のタイルをクリック
3. タイルが消えてスコア獲得！
4. 消せるタイルがなくなったらゲーム終了

### 🎯 ルール

- **消去条件**: 同じ色で隣接する2個以上のグループ
- **スコア計算**: `(タイル数 - 2)²`
  - 2個: 0点
  - 3個: 1点
  - 4個: 4点
  - 5個: 9点
- **重力**: タイル消去後、上のタイルが下に落ちる
- **終了**: 消せるグループがなくなったら終了

### 🛠️ 技術仕様

- **Vanilla JavaScript** - ビルド不要
- **CSS clip-path** - 六角形描画
- **Axial座標系** - 六角形グリッド管理
- **GitHub Pages対応** - 静的ホスティング

### 📁 ファイル構成

```
/
├── index.html          # メインHTML
├── style.css           # スタイルシート
├── game.js             # ゲームロジック
├── test.html           # テストランナー
├── test.js             # テストスイート
├── README.md           # このファイル
├── REQUIREMENTS.md     # 要件定義書
├── SPEC.md             # 詳細仕様書
└── TEST_DESIGN.md      # テスト設計書
```

### 🚀 ローカルで遊ぶ

#### 方法1: 直接開く
```bash
# ブラウザで直接開く
open index.html
```

#### 方法2: HTTPサーバー
```bash
# Python 3
python -m http.server 8000

# Node.js (npx)
npx serve

# ブラウザで http://localhost:8000 を開く
```

### 🧪 テストを実行

包括的なユニットテストと統合テストを実装済み。

#### テスト実行方法

**方法1: Node.js（推奨）**
```bash
# テストを実行（131個のテストケース）
npm test

# または直接実行
node test-node.js
```

**方法2: ブラウザ（Mocha UI）**
```bash
# HTTPサーバーを起動
python -m http.server 8000

# ブラウザで http://localhost:8000/test.html を開く
```

**方法3: モンキーテスト（ストレステスト）**
```bash
# 基本モンキーテスト - ランダム操作
node monkey-test.js

# 高度なモンキーテスト - 六角形グリッドの検証
node advanced-monkey-test.js

# ファズテスト - エッジケースと無効な入力
node fuzz-test.js

# ロジックバグテスト - ゲームロジックの検証
node logic-bug-test.js
```

#### テストカバレッジ

- ✅ **境界値分析**: 座標、グループサイズ、スコアの境界値
- ✅ **状態遷移テスト**: ゲーム状態、タイル状態の遷移
- ✅ **ユニットテスト**: 全関数の個別テスト
- ✅ **統合テスト**: ゲームフロー全体のテスト
- ✅ **モンキーテスト**: ランダム操作、ストレステスト、エッジケース（数百のテストケース）
- ✅ **ファズテスト**: 無効な入力、極端な値、不正なデータ
- ✅ **ロジック検証**: 重力物理演算、スコア正確性、ゲームオーバー判定

#### テストスイート詳細

| カテゴリ | テストケース数 | カバレッジ |
|---------|--------------|-----------|
| 六角形座標ユーティリティ | 12+ | 100% |
| グループ検出 (BFS) | 7+ | 100% |
| 重力処理 | 5+ | 100% |
| ゲーム終了判定 | 6+ | 100% |
| スコア計算 | 2+ | 100% |
| 境界値テスト | 3+ | - |
| 統合テスト | 2+ | - |

詳細は [TEST_DESIGN.md](TEST_DESIGN.md) を参照。

### 📝 ドキュメント

- [REQUIREMENTS.md](REQUIREMENTS.md) - MVP要件定義
- [SPEC.md](SPEC.md) - 詳細仕様書
- [TEST_DESIGN.md](TEST_DESIGN.md) - テスト設計書

### 🎨 カラーパレット

- 🔴 赤: `#FF6B6B`
- 🔵 青: `#4ECDC4`
- 🟢 緑: `#95E1D3`
- 🟡 黄: `#FFE66D`

### 🧩 六角形グリッドの特徴

- 各タイルは最大**6方向**に隣接（従来の4方向より戦略的）
- Pointy-top方式（尖った頂点が上）
- 8列 × 9行のグリッド

### 📜 ライセンス

MIT License
