# beez

![LOGO](https://github.com/CyberAgent/beez/raw/master/design/beez_200x200.png)


## About beez

beez は、複雑化するスマートフォン向けブラウザアプリ開発をスピーディーにする目的で開発された、中・大規模向けフレームワークを含む開発ツールキットです

## なぜbeezを使うのか？

スマートフォン向けのブラウザアプリ開発には、素晴らしいフレームワーク、ライブラリがすでにありますがそれらを選定し、つなぎあわせて開発を行うのは知識・経験を必要とするため大変です。

beezではこうしたライブラリを取りまとめ、一貫性のあるAPIで提供しています。

さらに、こうしたライブラリだけではなく開発に必要な環境もツールキットとして提供することで、開発初期段階からリリースまでの一連の作業をトータルでサポートすることで迅速な開発を実現するためにbeezは作られました。

## beezの特徴

beezの特徴としては、以下のようなものがあります。

### MVCR Manager

機能別に分割され複雑化したモジュール間の依存関係は開発者を悩ませ、保守性の低下やバグを多数生みます。

beezでは、独自のMVCR Managerというオブジェクトコンテナでこれらのモジュールを一括管理することで、依存関係をシンプルに解決することを可能にしました。  
依存関係のマッピングと各オブジェクトへのアクセスはJSONPathによって行われます。

### 拡張性

beezは、依存しているライブラリ自体を一切拡張していませんので、ユーザー独自の拡張も非常に簡単に行えます。

あなたの開発ワークフローにあった機能を追加・カスタマイズすることが可能です。

### ビルド・デプロイ

実際の開発現場では、ローカル・開発サーバ・ステージングサーバ・本番サーバと実行環境が移っていきますが、これら全ての環境を考えながら開発していくのは非常に大変な作業となります。

beezでは、環境別に変更されうる項目をすべて設定ファイルに別にすることが出来ます。  
一度環境設定ファイルを書いてしまえば、その後は環境の変化に煩わされることなく開発に専念できます。

### 開発サーバー

通常のローカル環境での開発は、リモートのWebサーバーを起動しサーバーサイドとの通信とセットで開発を行わないといけません(例えば、Ajaxを使用したページなどが代表です)。

beezでは付属のローカルサーバーを起動するだけで、静的ファイルの配信・モックサーバーを使用したサーバーサイドとの通信・StylusやHandlebars.jsの自動コンパイルなどをワンステップで利用することができます。

サーバーの起動の準備は、設定ファイルに簡単な記述をするだけで済むのでとてもスピーディーです。また、Grunt.jsに馴染みがあるなら、Grunt.jsを使いローカルサーバーを起動することも出来ます。

> 付属のサーバーについては[beez-foundation](https://github.com/CyberAgent/beez-foundation) を合わせて参照ください。

## Features

- [beez](https://github.com/CyberAgent/beez)
    - MVCR Manager
    - MVCRモデル
    - サブモジュール遅延ロードをサポート: [Require.js](http://requirejs.org/)
    - browser eventを管理: [Backbone.js](http://backbonejs.org/)
    - 国際化(i18n)対応
    - スマホに特化したUserAgent判定ライブラリ: [beez-ua]()
    - 非同期ライブラリ: [bucks.js](https://github.com/CyberAgent/bucks.js)
    - ログ出力: [logcafe.js](https://github.com/CyberAgent/logcafe.js)
    - OOPライクなコーディングスタイル extend/mixin
    - テンプレートエンジン [Handlebars.js](http://handlebarsjs.com/)
    - CSS プリプロセッサー [Stylus](http://learnboost.github.io/stylus/docs/variables.html)
    - JavaScriptユーティリティライブラリ[Underscore.js](http://underscorejs.org/) / [Lo-Dash](http://lodash.com/)
    - `setInterval` / `setTimeout`を一元管理

- [beez-foundation](https://github.com/CyberAgent/beez-foundation)(ローカルサーバー)
    - 設定ファイルはAuto-reloadをサポート。ソース変更の確認にもうローカルサーバの再起動は不要
    - Stylus内の画像、Web-fontを自動でbase64化
    - CSS画像スプライト自動生成
    - オリジナル画像を元にpixelRatio別に画像を自動生成
    - 静的ファイルの配信
    - モックを使用したサーバーサイド通信
    - Stylus自動コンパイル
    - Handlebars.js自動プレコンパイル

- ビルド・デプロイ
    - 設定ファイルの変更のみで環境差異を吸収
    - js/css/imageファイルをサブモジュール別に圧縮・配置

> その他多数の、機能を標準搭載しています。


## Getting started

@see wiki : [Wiki - Documention](https://github.com/CyberAgent/beez/wiki)

## Requirements

beezが依存しているライブラリは以下になります。

### beez 本体依存ライブラリ

- [Backbone.js](http://backbonejs.org/)
- [Underscore.js](http://underscorejs.org/)
- [Zepto.js](http://zeptojs.com/)
- [RequireJS](http://requirejs.org/)
- [Handlebars](http://handlebarsjs.com/)
- [beez-ua](https://github.com/CyberAgent/beez-ua)

- 組み込みライブラリ
    - [JSONPath](http://goessner.net/articles/JsonPath/)
    - [bucks.js](https://github.com/CyberAgent/bucks.js)
    - [suns.js](https://github.com/CyberAgent/suns.js)
    - [logcafe.js](https://github.com/CyberAgent/logcafe.js)

### beez を利用した開発環境に使用するライブラリ

- [beez-foundation](https://github.com/CyberAgent/beez-foundation)
- [Stylus](http://learnboost.github.com/stylus/)
- [nib](https://github.com/visionmedia/nib)
- [node.js](http://nodejs.org/)
- [jsdoc3](https://github.com/jsdoc3/jsdoc)
- [mocha](http://visionmedia.github.com/mocha/)
- [Chai](http://chaijs.com/)
- [beezlib](https://github.com/CyberAgent/beezlib)
- [JSHint](http://www.jshint.com/)
- [plato](https://github.com/jsoverson/plato)
- [jsonminify](https://github.com/fkei/JSON.minify)
- [useragent](https://github.com/3rd-Eden/useragent)
- [commander](https://github.com/visionmedia/commander.js/)
- [colors](https://github.com/marak/colors.js/)
- [handlebars](http://handlebarsjs.com/)
- [hbs](https://github.com/donpark/hbs)

> Versionについては、`package.json` を参照ください。

## 姉妹プロジェクト

- [beez-foundation](https://github.com/CyberAgent/beez-foundation)
- [beezlib](https://github.com/CyberAgent/beezlib)
- [beez-ua](https://github.com/CyberAgent/beez-ua)

## 関連プロジェクト

- [Layzie/generator-beez](https://github.com/Layzie/generator-beez)
    - beezのプラグインを作成するYeomanジェネレータ
- [Layzie/generator-beez-submodule](https://github.com/Layzie/generator-beez-submodule)
    - beezのサブモジュール(プロジェクト内の各ディレクトリ)を作成するYeomanジェネレータ
- [fkei/beez-confbuilder](https://github.com/fkei/beez-confbuilder)
    - beezの環境別設定ファイルをテンプレートから生成する設定ファイルビルダー
- [fkei/grunt-beez-confbuilder](https://github.com/fkei/grunt-beez-confbuilder) 
    - beez-confbuilderをGruntから実行できるGruntタスク

## Changelog

@see: [Changelog](https://github.com/CyberAgent/beez/blob/master/Changelog)


## Contributing

- Kei FUNAGAYAMA - [@fkei](https://twitter.com/fkei) [github](https://github.com/fkei)
- Kazuma MISHIMAGI - [@maginemu](https://twitter.com/maginemu) [github](https://github.com/maginemu)
- HIRAKI Satoru - [github](https://github.com/Layzie)
- Yuhei Aihara - [github](https://github.com/yuhei-a)
- Go Ohtani - [@GO_OHTANI](https://twitter.com/GO_OHTANI) [github](https://github.com/goohtani)
- Toshihide Yoshimura
- Hirotaka Kubo
- Naoki Murata - [@naota70](https://twitter.com/naota70) [github](https://github.com/naota70)
- Yuto Yoshinari - [@y_yoshinari](https://twitter.com/y_yoshinari)[github](https://github.com/y-yoshinari)
- Yutaka Sasaki
- Masaki Sueda - [@maaaaaaa0701](https://twitter.com/maaaaaaa0701) [github](https://github.com/masakisueda) 

## Copyright

CyberAgent, Inc. All rights reserved.

## LICENSE

@see : [LICENSE](https://raw.github.com/CyberAgent/beez/master/LICENSE)

```
The MIT License (MIT)

Copyright © CyberAgent, Inc. All Rights Reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

```

[jsonpath](https://code.google.com/p/jsonpath/) included in this product is [MIT License](http://opensource.org/licenses/mit-license.php).


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/CyberAgent/beez/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

