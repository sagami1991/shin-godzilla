# JupiterStory

* demo [https://jupiter-story.herokuapp.com/](https://jupiter-story.herokuapp.com/)
## 開発環境
* エディタ
  * VisualStudioCode
* 言語
  * Typescript(javascript)
* データベース
  * mongoDB
* サーバー
  * heroku
* ビルドツール
  * サーバーサイド
    * gulp
  * クライアントサイド
    * webpack

## 単語について
* Typescript
  * コンパイルするとjavascriptになるC#ライクな言語
  * サーバーサイドもこれで書いているが、正直ほかの言語で書きたい
* Webpack, gulp
  * 主にフロントエンドの開発に使われるビルドツール
  * Typescriptをjavascriptにビルドするのに使っている
* mongoDB
  * JSONのまま保存できるデータベース
* heroku
  * 無料のサーバー

## 環境構築
 * インストールするもの
   * mongoDB
   * NodeJS
   * VisualStudioCode
 0. 必要なものをインストール
 0. mongoDBを起動
 0. このレポジトリをクローン
 0. クローンしたディレクトリで`npm install`を実行
 0. `localserver`を実行（自動更新スクリプトは組んでいないのでサーバーサイドを更新したら手動で立ち上げなおす）
 0. http://localhost:3000 で問題なく起動していることを確認
 0. `npm run build:client`を実行してクライアントサイドビルド（自動ビルドなのでこれは開いたまま）
 0. `npm run build:server`を実行してサーバーサイドビルド（自動ビルドなのでこれは開いたまま）

## ディレクトリ
* server
  * サーバーサイドのソースコード（jsファイルはビルドしたもの）
* src
  * フロントサイドのソースコード
* dist
  * フロントサイドをビルドしたもの
* node_modules
  * nodejsのライブラリ
* gulpfile.js
  * gulpの設定ファイル
* localserver.cmd
  * シェル変数にＤＢの接続先をセットしてサーバーを起動するスクリプト
* package.json
  * このパッケージのライブラリや起動スクリプトを書いたもの
* tsconfig.json
  * Typescriptの設定ファイル
* tslint.json
  * tslintの設定ファイル
* webpack.config.dev.js
  * webpackの設定ファイル