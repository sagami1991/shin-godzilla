# JupiterStory

## demo
* [https://jupiter-story.herokuapp.com/](https://jupiter-story.herokuapp.com/)

## 開発環境
* エディタ
  * VisualStudioCode
* 言語
  * Typescript(javascript)
* データベース
  * mongoDB
* 本番環境サーバー
  * heroku
* サーバーサイド関連事項
  * NodeJS
  * gulp
  * ws(WebSocketを使用するためのライブラリ)
  * express（MVCフレームワーク）
* クライアントサイド関連事項
  * canvas （javascriptでゲームを作るためのhtml5の機能）
  * webpack
  * core-js（ES6非対応ブラウザでもES6用関数使えるように）
  * handlebars(テンプレートエンジン)
  * scss (ビルトするとcssになる)


## 単語について
* Typescript
  * コンパイルするとjavascriptになるC#ライクな言語
  * サーバーサイドもこれで書いているが、正直ほかの言語で書きたい
* Webpack, gulp
  * 主にフロントエンドの開発に使われるビルドツール
  * Typescriptをjavascriptにビルドするのに使っている
  * webpackはcssや画像等も一緒にjs化してくれる
* mongoDB
  * JSONのまま保存できるデータベース
* heroku
  * 無料のサーバー


## 以下古い記述

```
## 環境構築
 0. 必要なものをインストール
    * mongoDB
    * NodeJS
    * VisualStudioCode
 0. mongoDBを起動
    * （例：`mongod --dbpath C:\app\mongodb\data --logpath C:\app\mongodb\logs\mongodb.log`）
 0. このレポジトリをクローン
 0. クローンしたディレクトリで`npm install`を実行
 0. `npm run localserver`を実行（自動更新スクリプトは組んでいないのでサーバーサイドを更新したら手動で立ち上げなおす）
 0. http://localhost:3000 で問題なく起動していることを確認
 0. `npm run build:client`を実行してクライアントサイドビルド（自動ビルドなのでこれは開いたまま）
 0. `npm run build:server`を実行してサーバーサイドビルド（自動ビルドなのでこれは開いたまま）
 0. VisualStudioCodeに拡張機能tslintを入れて開発を始める

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
* package.json
  * このパッケージのライブラリや起動スクリプトを書いたもの
* tsconfig.json
  * typescriptの設定ファイル
* tslint.json
  * tslintの設定ファイル
* webpack.config.dev.js
  * webpackの設定ファイル
* Procfile
  * herokuにデプロイするとこれが実行される
```