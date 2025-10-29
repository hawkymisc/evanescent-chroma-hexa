# アイコン画像

このディレクトリにはPWAアプリのアイコン画像を配置します。

## 必要なファイル

- `icon-192.png` - 192x192px
- `icon-512.png` - 512x512px

## アイコンの生成方法

### オプション1: SVGから生成（推奨）

`icon.svg`をベースに、以下のツールでPNGに変換できます：

1. **オンラインツール**
   - https://cloudconvert.com/svg-to-png
   - https://svgtopng.com/

2. **コマンドライン（ImageMagickが必要）**
   ```bash
   # 192x192
   convert -background none -resize 192x192 icon.svg icon-192.png

   # 512x512
   convert -background none -resize 512x512 icon.svg icon-512.png
   ```

3. **Node.js（sharp が必要）**
   ```bash
   npm install sharp
   node generate-icons.js
   ```

### オプション2: PWA Builder を使う

https://www.pwabuilder.com/ にアクセスして、アイコンを自動生成できます。

### オプション3: オンラインジェネレーター

- https://realfavicongenerator.net/
- https://favicon.io/

## アイコンのデザインガイドライン

- 六角形をモチーフにしたデザイン
- ブランドカラー: #667eea（紫）
- シンプルで認識しやすいデザイン
- マスカブル対応（セーフエリア80%）

## 現状

現在、`icon.svg`が配置されています。このSVGファイルをPNGに変換して、`icon-192.png`と`icon-512.png`を生成してください。

## 一時的な対応

アイコンが生成されるまで、PWA機能は動作しますが、アイコンが表示されない可能性があります。
