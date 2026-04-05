# 概要設計書

## 1. 目的

Vim操作において
- 削除したい
- コピーしたい
- 移動したい

など操作の目的からVimコマンドを検索できる機能を提供する

通常のVim学習では
```
操作 → コマンド
```
を覚える必要があるが、本拡張では

```
目的 → コマンド
```
の検索を可能にする

## 2. 想定ユーザー

- Vim初心者
- Vimコマンドを覚えきれていないユーザー
- コマンドを忘れた時にすぐ確認したいユーザー

主に
**VSCodeVim**
などを使用しているユーザーを想定

## 3. 機能概要
本拡張は以下のフローで動作する。
```
1 ショートカットキー実行
↓
2 操作タイプ選択
↓
3 Vimコマンド一覧表示
```

## 4. UI仕様

UIはQuickPick UIを使用する

QuickPickはVisual Studio Code標準の選択UIである。

## 5. 操作フロー

### Step1
ユーザーがショートカットキーを押す
例
```
Ctrl + Shift + ;
```
または
```
Command Palette
```
コマンド
```
Vim Action Search
```

### Step2

操作タイプを選択

QuickPick UIで表示

例
```
Select Action 

delete
copy
paste
move
select
change
indent
```

ユーザーは操作カテゴリを選択する

### Step3

コマンド一覧表示

選択した操作カテゴリに対応する
Vimコマンドを一覧表示する

例
```
Delete Commands 

dw delete word
dd delete line
d$ delete to end of line 
di" delete inside quotes
dap delete paragraph
```

表示内容
```
command + short description
```

## 6. データ構造(概念)

コマンドは**カテゴリ単位で管理する**

概念構造
```
Action
 ┣ delete
 ┣ copy
 ┣ paste
 ┣ move
 ┣ select
 ┗ change
 ```

 各Actionに複数のVimコマンドを紐づける

 例
 ```
 delete
 ┣ dw
 ┣ dd
 ┣ d$
 ┣ diw
 ┗ dap
 ```

## 7. 表示データ

各コマンドは以下の情報を持つ
```
command
description 
category
```

例
```
dw
delete word
delete
```
## 8. 将来拡張(予定)

初期バージョンでは実装しないが、将来的に追加予定

### UI拡張
- fuzzy search 
- 日本語検索
- 操作説明検索

例
```
delete word
```
↓
```
dw
```

### 操作補助
- コマンドコピー
- コマンド実行
- Vim tutor mode

## 9. 非機能要件

### パフォー万津

QuickPick表示は
100ms以内を目標とする

### 拡張性

コマンドデータは
JSONまたは構造データとして管理し
将来の追加を容易にする。

## 10. MVP範囲

機能
```
ショートカット起動
↓
操作カテゴリ選択
↓
コマンド一覧表示
```

対象カテゴリ
```
delete
copy
paste
move
select
```

## 11. 開発フェーズ

### Phase1
概要設計
(このドキュメント)

### Phase2
詳細設計
- コマンドデータ構造
- QuickPick UI設計
- Extension構造

### Phase3
実装
- extension.ts
- datak形
- UI管理

### Phase4
テスト
- UX確認
- コマンド網羅性
