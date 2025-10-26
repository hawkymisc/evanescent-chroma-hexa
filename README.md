# Evanescent Chroma Hexa

六角形グリッドで遊ぶ、色合わせパズルゲーム。

## 🎮 プレイ方法

1. `index.html` をブラウザで開く
2. 同じ色で隣接する2個以上のタイルをクリック
3. タイルが消えてスコア獲得！
4. 消せるタイルがなくなったらゲーム終了

## 🎯 ルール

- **消去条件**: 同じ色で隣接する2個以上のグループ
- **スコア計算**: `(タイル数 - 2)²`
  - 2個: 0点
  - 3個: 1点
  - 4個: 4点
  - 5個: 9点
- **重力**: タイル消去後、上のタイルが下に落ちる
- **終了**: 消せるグループがなくなったら終了

## 🛠️ 技術仕様

- **Vanilla JavaScript** - ビルド不要
- **CSS clip-path** - 六角形描画
- **Axial座標系** - 六角形グリッド管理
- **GitHub Pages対応** - 静的ホスティング

## 📁 ファイル構成

```
/
├── index.html          # メインHTML
├── style.css           # スタイルシート
├── game.js             # ゲームロジック
├── README.md           # このファイル
├── REQUIREMENTS.md     # 要件定義書
└── SPEC.md             # 詳細仕様書
```

## 🚀 ローカルで遊ぶ

### 方法1: 直接開く
```bash
# ブラウザで直接開く
open index.html
```

### 方法2: HTTPサーバー
```bash
# Python 3
python -m http.server 8000

# Node.js (npx)
npx serve

# ブラウザで http://localhost:8000 を開く
```

## 📝 ドキュメント

- [REQUIREMENTS.md](REQUIREMENTS.md) - MVP要件定義
- [SPEC.md](SPEC.md) - 詳細仕様書

## 🎨 カラーパレット

- 🔴 赤: `#FF6B6B`
- 🔵 青: `#4ECDC4`
- 🟢 緑: `#95E1D3`
- 🟡 黄: `#FFE66D`

## 🧩 六角形グリッドの特徴

- 各タイルは最大**6方向**に隣接（従来の4方向より戦略的）
- Pointy-top方式（尖った頂点が上）
- 8列 × 9行のグリッド

## 📜 ライセンス

MIT License
