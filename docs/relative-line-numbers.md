# 相対行番号機能 実装ドキュメント

## 概要

vim-mode-visualizer に相対行番号表示機能を実装しました。カーソル位置を基準に、各行との距離を数値で表示します。

## 機能説明

### 表示仕様
- **カーソル行**: `0` と表示
- **カーソル上下**: 距離を数値で表示（1, 2, 3...）
- **表示位置**: ガター領域（行番号の左側）
- **表示形式**: SVG形式のグリフアイコン

### 利用シーン
Vim ユーザーが相対行数を指定したコマンド（例：`5j` で5行下へ移動）を実行する際に便利です。

---

## 実装の主要コンポーネント

### 1. DecorationManager クラス（`src/decorationManager.ts`）

#### 新規プロパティ

```typescript
private decorTypeMap: Map<vscode.TextEditor, Map<number, vscode.TextEditorDecorationType>>;
private decorNumMap: Map<vscode.TextEditor, Map<number, number>>;
private updateDecorDebounced!: (editor: vscode.TextEditor) => void;
private readonly NO_DECOR = -1;
```

**役割:**
- `decorTypeMap`: エディタごと、行ごとのデコレーション型（SVG glyph）を保持
- `decorNumMap`: 各行に現在適用されている相対距離を記録（重複作成を防ぐ）
- `updateDecorDebounced`: 50ms の遅延を入れた更新関数（パフォーマンス最適化）
- `NO_DECOR`: 表示なしの定数

#### 新規メソッド

##### `initializeUpdateDecorDebounced()`
```typescript
private initializeUpdateDecorDebounced() {
    const delayTime = 50;
    this.updateDecorDebounced = this.debounce(
        this.updateRelativeLineNumbers.bind(this),
        delayTime
    );
}
```
**目的**: 50ms の debounce 付きで相対行番号更新を実行  
**効果**: カーソル高速移動時に頻繁な描画更新を制御

##### `debounce(func: Function, wait: number, immediate?: boolean)`
```typescript
private debounce(func: Function, wait: number, immediate: boolean = false) {
    let timeout: NodeJS.Timeout | null = null;
    return (...args: any[]) => {
        const later = () => {
            timeout = null;
            if (!immediate) {
                func(...args);
            }
        };
        const callNow = immediate && !timeout;
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
        if (callNow) {
            func(...args);
        }
    };
}
```
**目的**: 関数実行を遅延させてパフォーマンス向上  
**詳細**:
- タイマーが設定されている間は前の実行をキャンセル
- wait時間経過後に実行
- immediate フラグで即座実行も可能

##### `getSvgUri(num: number): string`
```typescript
private getSvgUri(num: number): string {
    const width = 100;
    const height = 100;
    const x = width / 2;
    const y = height / 2;
    const lengthAdjust = 'spacingAndGlyphs';
    const textAnchor = 'middle';
    const dominantBaseline = 'central';
    const fill = encodeURIComponent(
        vscode.workspace.getConfiguration()
            .get('vscode-double-line-numbers.font.color', '#858585')
    );
    const fontWeight = vscode.workspace
        .getConfiguration()
        .get('vscode-double-line-numbers.font.weight', '400');
    const fontFamily = vscode.workspace
        .getConfiguration()
        .get(
            'vscode-double-line-numbers.font.family',
            vscode.workspace.getConfiguration().get('editor.fontFamily', 'monospace')
        );
    const textLength = vscode.workspace
        .getConfiguration()
        .get('vscode-double-line-numbers.text.width', '80');
    const fontSize = vscode.workspace
        .getConfiguration()
        .get('vscode-double-line-numbers.text.height', '75');

    return `data:image/svg+xml;utf8,<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><text x="${x}" y="${y}" textLength="${textLength}" lengthAdjust="${lengthAdjust}" font-weight="${fontWeight}" font-size="${fontSize}" font-family="${fontFamily}" fill="${fill}" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}">${num
        .toString()
        .padStart(3, '\u00A0')}</text></svg>`;
}
```
**目的**: 数値をSVG形式でエンコードしてデータURI化  
**機能**:
- 設定から フォント色・ウェイト・ファミリーを取得
- テキスト配置を中央揃え（text-anchor, dominant-baseline）
- 数値を3桁にパディング（左側ノーブレーク空白で埋め）
- data:image/svg+xml スキームでインライン埋め込み

##### `createDecorType(num: number): vscode.TextEditorDecorationType`
```typescript
private createDecorType(num: number): vscode.TextEditorDecorationType {
    if (num > 0) {
        return vscode.window.createTextEditorDecorationType({
            gutterIconPath: vscode.Uri.parse(this.getSvgUri(num)),
            gutterIconSize: 'cover',
        });
    } else {
        return vscode.window.createTextEditorDecorationType({});
    }
}
```
**目的**: 数値ごとに異なるデコレーション型を生成  
**詳細**:
- `num > 0` の場合: SVG glyph を ガターアイコンとして適用
- `num <= 0` の場合: 空のデコレーション型を返す（表示なし）
- `gutterIconSize: 'cover'` で ガター内に収まるようスケーリング

##### `updateRelativeLineNumbers(editor: vscode.TextEditor)`
```typescript
private updateRelativeLineNumbers(editor: vscode.TextEditor) {
    console.log('updateRelativeLineNumbers called');

    const start = Math.max(editor.visibleRanges[0].start.line - 1, 0);
    const end = Math.min(
        editor.visibleRanges[0].end.line + 1,
        editor.document.lineCount - 1
    );
    const activeLine = editor.selection.active.line;

    if (!this.decorTypeMap.has(editor)) {
        this.decorTypeMap.set(editor, new Map());
    }
    if (!this.decorNumMap.has(editor)) {
        this.decorNumMap.set(editor, new Map());
    }

    for (let i = start; i <= end; ++i) {
        const num = Math.abs(activeLine - i);

        if (this.decorNumMap.get(editor)!.get(i) !== num) {
            this.decorTypeMap.get(editor)!.get(i)?.dispose();
            this.decorTypeMap.get(editor)!.set(i, this.createDecorType(num));
            this.decorNumMap.get(editor)!.set(i, num);
        }
    }

    for (let i = start; i <= end; ++i) {
        if (this.decorNumMap.get(editor)!.has(i)) {
            editor.setDecorations(this.decorTypeMap.get(editor)!.get(i)!, [
                new vscode.Range(i, 0, i, 0),
            ]);
        }
    }
}
```
**目的**: 表示範囲内の全行に相対行番号デコレーションを適用  
**処理フロー**:
1. 表示範囲（visible range）を取得し、前後1行ずつ含める
2. アクティブ行を取得
3. エディタ用のマップを初期化
4. **第1ループ**: 各行の相対距離を計算
   - 前回と異なる場合のみ新規デコレーション型を作成
   - 古いデコレーション型は破棄（メモリ効率化）
5. **第2ループ**: 各行にデコレーションを適用

##### `showRelativeLineNumbers(editor: vscode.TextEditor)`
```typescript
showRelativeLineNumbers(editor: vscode.TextEditor) {
    console.log('RELATIVE CALLED');
    this.updateDecorDebounced(editor);
}
```
**目的**: 外部から相対行番号更新をトリガー  
**詳細**: debounce 経由で呼び出すため、連続呼び出しが自動的にスロットル化される

##### `clearRelativeNumbers(editor: vscode.TextEditor)`
```typescript
clearRelativeNumbers(editor: vscode.TextEditor) {
    if (!this.decorTypeMap.has(editor)) return;

    this.decorTypeMap.get(editor)!.forEach((decor) => {
        decor.dispose();
    });
    this.decorTypeMap.delete(editor);
    this.decorNumMap.delete(editor);
}
```
**目的**: エディタの相対行番号表示をクリア・リソース解放  
**用途**: 別の Vim モード（INSERT など）に切り替える際に使用

#### 修正されたメソッド

##### `constructor()`
初期化時に `debounce` 関数を初期化

##### `dispose()`
デコレーション型マップの全リソースを破棄

```typescript
dispose() {
    // ...既存のコード...
    this.decorTypeMap.forEach((decorMap) => {
        decorMap.forEach((decor) => {
            decor.dispose();
        });
    });
    this.decorTypeMap.clear();
    this.decorNumMap.clear();
}
```

---

### 2. extension.ts（`src/extension.ts`）

#### 追加機能

##### ガターマージン自動有効化
```typescript
export function activate(context: vscode.ExtensionContext) {
  console.log('vim-mode-visualizer: activate');

  // Enable glyph margin for relative line numbers
  vscode.workspace.getConfiguration().update(
    'editor.glyphMargin',
    true,
    vscode.ConfigurationTarget.Global
  );

  // ...以下のコード...
}
```
**目的**: ユーザーの設定に関わらず、拡張有効化時にガター領域を有効に  
**効果**: SVG アイコン表示に必要な ガターマージンを自動確保

##### イベントリスナー追加

**セレクション変更リスナー:**
```typescript
const selectionListener =
  vscode.window.onDidChangeTextEditorSelection((event) => {
    console.log('selection changed');
    const editor = event.textEditor;
    decorations.showRelativeLineNumbers(editor);
    modeController?.handleSelectionChange();
  });
```
**トリガー**: カーソル移動時  
**効果**: 相対距離を再計算

**アクティブエディタ変更リスナー:**
```typescript
const activeEditorListener = 
  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      decorations.showRelativeLineNumbers(editor);
    }
  });
```
**トリガー**: エディタウィンドウ切り替え時  
**効果**: 新エディタでも相対行番号表示を即座に開始

**表示範囲変更リスナー:**
```typescript
const visibleRangesListener =
  vscode.window.onDidChangeTextEditorVisibleRanges((event) => {
    console.log('visible ranges changed');
    const editor = event.textEditor;
    decorations.showRelativeLineNumbers(editor);
  });
```
**トリガー**: スクロール時、ビューポート変更時  
**効果**: オフスクリーンになった行のデコレーションは自動的に削除され、表示範囲内のみ描画

---

### 3. ModeController クラス（`src/modeController.ts`）

#### 追加機能

##### モード別の相対行番号制御

`setMode()` メソッド内に追加:
```typescript
// 4. Relative Line Numbers（Normal系のみ表示がおすすめ）
if (editor) {
    if (mode === VimMode.NORMAL || mode === VimMode.REPLACE) {
        this.decorations.showRelativeLineNumbers(editor);
    } else {
        this.decorations.clearRelativeNumbers(editor);
    }
}
```
**目的**: Normal/Replace モードのみ相対行番号を表示  
**理由**: Insert/Visual モードでは不要なため、視認性を維持

##### セレクション変更時の更新

`handleSelectionChange()` メソッド内に追加:
```typescript
// 相対行番号も更新
this.decorations.showRelativeLineNumbers(editor);
```
**目的**: モード内でのセレクション変更時に相対行番号を再計算

##### エディタイベント統合

コンストラクタ内の disposables に追加:
```typescript
this.disposables.push(

    vscode.window.onDidChangeTextEditorSelection((event) => {
        const editor = event.textEditor;

        if (!editor) return;

        this.handleSelectionChange();

        // 相対行番号更新
        this.decorations.showRelativeLineNumbers(editor);
    }),

    vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (!editor) return;

        if (this.currentMode) {
            this.decorations.applyModeHighlight(editor, this.currentMode);
        }

        this.decorations.showRelativeLineNumbers(editor);
    })
);
```
**目的**: モードコントローラーでも相対行番号を管理対象に追加

---

### 4. ConfigService クラス（`src/configService.ts`）

#### 追加メソッド

```typescript
isRelativeLineEnabled(): boolean {
    return vscode.workspace
        .getConfiguration('vimModeVisualizer')
        .get('relativeLineNumbers', true);
}
```
**目的**: 拡張設定から相対行番号表示の有効/無効を取得  
**デフォルト**: true（有効）

#### 設定項目（package.json）

```json
"vimModeVisualizer.relativeLinerNumbers": {
  "type": "boolean",
  "default": true,
  "definitions": "Show relative line numbers"
}
```
**注記**: 現在の実装では使用されていませんが、将来の機能拡張用に追加

---

## パフォーマンス最適化

### 1. Debouncing（50ms）
- カーソル高速移動時に、頻繁な再描画を制御
- メモリ効率と UI レスポンスのバランスを実現

### 2. キャッシング（decorTypeMap / decorNumMap）
- 同じ距離の行には同じデコレーション型を再利用
- 行ごとの前回値を記録して、変更があるときのみ作成

### 3. 表示範囲フィルタリング
- `visibleRanges` を使用して、画面外の行は処理対象外
- スクロールに応じて自動的に無関係なデコレーションをクリア

---

## 動作フロー

```
┌─────────────────────────────────┐
│  イベント発生                    │
│  (cursor move / scroll / etc)    │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  showRelativeLineNumbers()       │
│  外部インターフェース             │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  updateDecorDebounced()          │
│  (50ms debounce)                 │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  updateRelativeLineNumbers()     │
│  実際の処理                      │
└────────────┬────────────────────┘
             │
       ┌─────┴──────┐
       ▼            ▼
┌─────────────┐  ┌─────────────┐
│ 表示範囲内  │  │ decorTypeMap│
│ 行を計算    │  │ を検索・更新 │
└──────┬──────┘  └──────┬──────┘
       │                 │
       └─────────┬───────┘
                 ▼
         ┌───────────────┐
         │ SVG 生成      │
         │ (getSvgUri)   │
         └───────┬───────┘
                 ▼
         ┌───────────────┐
         │ デコレーション│
         │ 適用          │
         │ (setDecorations)
         └───────────────┘
```

---

## 使用技術・API

| 技術/API | 目的 | 詳細 |
|---------|------|------|
| `vscode.Uri.parse()` | SVG data URI | SVG コンテンツを URI スキームに変換 |
| `vscode.window.createTextEditorDecorationType()` | デコレーション型定義 | 外観・位置情報を定義 |
| `gutterIconPath` | ガター アイコン配置 | ガター領域に SVG を表示 |
| `editor.setDecorations()` | デコレーション適用 | Range を指定して装飾を適用 |
| `editor.visibleRanges` | 表示範囲取得 | スクリーン内の行範囲を取得 |
| `editor.selection.active.line` | カーソル位置 | アクティブカーソルの行番号 |

---

## トラブルシューティング

### 相対行番号が表示されない場合

1. **ガターマージンの確認**
   ```json
   "editor.glyphMargin": true
   ```
   - ユーザー設定で `editor.glyphMargin` が false になっていないか確認

2. **コンソール確認**
   - DevTools コンソール（Cmd+Shift+I）で以下ログを確認
   - `vim-mode-visualizer: activate` → 拡張起動確認
   - `updateRelativeLineNumbers called` → 更新関数呼び出し確認
   - `RELATIVE CALLED` → トリガー確認

3. **モード確認**
   - Normal/Replace モード以外では表示されません
   - ステータスバーでモード表示を確認

### 表示がちらつく場合

- debounce 時間（`delayTime`）を増やす
  ```typescript
  const delayTime = 100; // 50 -> 100 に変更
  ```

### パフォーマンス低下

- キャッシュをクリア（エディタを閉じる）して再度開く
- VSCode を再起動

---

## Hybrid Mode 実装ガイド（絶対行 + 相対行の同時表示）

### 概要

ガター領域に絶対行番号（通常の行番号）と相対行番号を同時表示する Hybrid mode を実装する方法を説明します。

**表示イメージ:**
```
[絶対] [相対]  コード
   1      5    function foo() {
   2      4      console.log('test');
   3      3    }
   4      2
>  5    | 0  | <- cursor here
   6      1
   7      2
   8      3
```

### 実装方法

#### 方法1: VS Code 標準行番号 + カスタム相対行番号（推奨・簡単）

**変更内容:**

##### 1. extension.ts の activate() を修正
```typescript
export function activate(context: vscode.ExtensionContext) {
  console.log('vim-mode-visualizer: activate');

  // Enable glyph margin for relative line numbers
  vscode.workspace.getConfiguration().update(
    'editor.glyphMargin',
    true,
    vscode.ConfigurationTarget.Global
  );

  // 新規: 絶対行番号を有効化
  vscode.workspace.getConfiguration().update(
    'editor.lineNumbers',
    'on',  // 'off' から 'on' に変更
    vscode.ConfigurationTarget.Global
  );

  const decorations = new DecorationManager();
  // ...以下同様...
}
```

**メリット:**
- VS Code の標準行番号を使うため、実装が簡単
- パフォーマンスが良好（VS Code が最適化）
- ユーザー設定で行番号スタイルを変更可能

**デメリット:**
- 絶対行番号の表示位置やスタイルをカスタマイズできない
- VS Code の標準行番号領域と相対行番号（ガター）の間に隙間がある可能性

---

#### 方法2: カスタムデコレーションで絶対行番号を表示（カスタマイズ性重視）

両方を SVG ガターアイコンで実装する方法です。参考コードの "vscode-double-line-numbers" 風の実装になります。

##### 1. DecorationManager.ts に新規メソッドを追加
```typescript
private createHybridSvgUri(absLine: number, relDist: number): string {
    const width = 120;
    const height = 100;
    const absX = 30;      // 左側：絶対行番号
    const relX = 80;      // 右側：相対行番号
    const y = height / 2;
    const fontSize = '60';
    const fontWeight = '600';
    const fontFamily = 'monospace';
    const absFill = encodeURIComponent('#999999');  // 薄い灰色
    const relFill = encodeURIComponent(
        relDist === 0 ? '#2196F3' : '#858585'
    );

    return `data:image/svg+xml;utf8,<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <text x="${absX}" y="${y}" font-size="${fontSize}" font-weight="${fontWeight}" font-family="${fontFamily}" fill="${absFill}" text-anchor="middle" dominant-baseline="central">${absLine.toString().padStart(2, ' ')}</text>
        <text x="${relX}" y="${y}" font-size="${fontSize}" font-weight="${fontWeight}" font-family="${fontFamily}" fill="${relFill}" text-anchor="middle" dominant-baseline="central">${relDist.toString().padStart(2, ' ')}</text>
    </svg>`;
}

private createHybridDecorType(absLine: number, relDist: number): vscode.TextEditorDecorationType {
    return vscode.window.createTextEditorDecorationType({
        gutterIconPath: vscode.Uri.parse(this.createHybridSvgUri(absLine, relDist)),
        gutterIconSize: 'cover',
    });
}

private updateHybridLineNumbers(editor: vscode.TextEditor) {
    console.log('updateHybridLineNumbers called');

    const start = Math.max(editor.visibleRanges[0].start.line - 1, 0);
    const end = Math.min(
        editor.visibleRanges[0].end.line + 1,
        editor.document.lineCount - 1
    );
    const activeLine = editor.selection.active.line;

    if (!this.decorTypeMap.has(editor)) {
        this.decorTypeMap.set(editor, new Map());
    }
    if (!this.decorNumMap.has(editor)) {
        this.decorNumMap.set(editor, new Map());
    }

    for (let i = start; i <= end; ++i) {
        const relDist = Math.abs(activeLine - i);
        const absLine = i + 1;  // 1-indexed
        const key = `${absLine}:${relDist}`;  // キャッシュキー

        // キャッシュをチェック（前回と同じキーの場合はスキップ）
        if (this.decorNumMap.get(editor)!.get(i) !== key) {
            this.decorTypeMap.get(editor)!.get(i)?.dispose();
            this.decorTypeMap.get(editor)!.set(i, this.createHybridDecorType(absLine, relDist));
            this.decorNumMap.get(editor)!.set(i, key);
        }
    }

    for (let i = start; i <= end; ++i) {
        if (this.decorNumMap.get(editor)!.has(i)) {
            editor.setDecorations(this.decorTypeMap.get(editor)!.get(i)!, [
                new vscode.Range(i, 0, i, 0),
            ]);
        }
    }
}

showHybridLineNumbers(editor: vscode.TextEditor) {
    console.log('HYBRID CALLED');
    this.updateDecorDebounced(editor);  // 既存の debounce を再利用可能に変更
}
```

##### 2. extension.ts の activate() を修正
```typescript
export function activate(context: vscode.ExtensionContext) {
  console.log('vim-mode-visualizer: activate');

  // Enable glyph margin for relative line numbers
  vscode.workspace.getConfiguration().update(
    'editor.glyphMargin',
    true,
    vscode.ConfigurationTarget.Global
  );

  // Hybrid mode: 標準行番号を無効化（カスタム表示するため）
  vscode.workspace.getConfiguration().update(
    'editor.lineNumbers',
    'off',  // カスタムで両方表示するため無効化
    vscode.ConfigurationTarget.Global
  );

  const decorations = new DecorationManager();
  // ...以下同様...
}
```

##### 3. extension.ts のイベントリスナー修正
```typescript
const selectionListener =
  vscode.window.onDidChangeTextEditorSelection((event) => {
    console.log('selection changed');
    const editor = event.textEditor;
    // decorations.showRelativeLineNumbers(editor);  // これを変更
    decorations.showHybridLineNumbers(editor);       // Hybrid に変更
    modeController?.handleSelectionChange();
  });

const activeEditorListener = 
  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      // decorations.showRelativeLineNumbers(editor);  // これを変更
      decorations.showHybridLineNumbers(editor);       // Hybrid に変更
    }
  });

const visibleRangesListener =
  vscode.window.onDidChangeTextEditorVisibleRanges((event) => {
    console.log('visible ranges changed');
    const editor = event.textEditor;
    // decorations.showRelativeLineNumbers(editor);  // これを変更
    decorations.showHybridLineNumbers(editor);       // Hybrid に変更
  });
```

##### 4. ModeController.ts 修正
```typescript
// setMode() メソッド内
if (editor) {
    if (mode === VimMode.NORMAL || mode === VimMode.REPLACE) {
        // this.decorations.showRelativeLineNumbers(editor);  // これを変更
        this.decorations.showHybridLineNumbers(editor);       // Hybrid に変更
    } else {
        this.decorations.clearRelativeNumbers(editor);
    }
}

// handleSelectionChange() メソッド内
// 相対行番号も更新
// this.decorations.showRelativeLineNumbers(editor);  // これを変更
this.decorations.showHybridLineNumbers(editor);       // Hybrid に変更
```

**メリット:**
- 絶対行番号と相対行番号をカスタムデコレーションで完全制御
- 色・フォント・レイアウトを細かくカスタマイズ可能
- "vscode-double-line-numbers" 拡張と同等の機能を実装

**デメリット:**
- デコレーション型の作成・管理が増えるため、メモリ使用量が若干増加
- 実装が複雑になる

---

### 方法3: 設定オプションで切り替え可能（最適）

#### 1. package.json に設定を追加
```json
"vimModeVisualizer.lineNumberMode": {
  "type": "string",
  "enum": ["relative", "hybrid"],
  "default": "relative",
  "description": "Line number display mode: 'relative' (相対行のみ) or 'hybrid' (絶対+相対)"
}
```

#### 2. ConfigService.ts に設定取得メソッドを追加
```typescript
getLineNumberMode(): string {
    return vscode.workspace
        .getConfiguration('vimModeVisualizer')
        .get('lineNumberMode', 'relative');
}
```

#### 3. extension.ts で設定を読み込み
```typescript
export function activate(context: vscode.ExtensionContext) {
  const config = new ConfigService();
  const mode = config.getLineNumberMode();

  if (mode === 'hybrid') {
    // Hybrid モード: 標準行番号を無効化
    vscode.workspace.getConfiguration().update(
      'editor.lineNumbers',
      'off',
      vscode.ConfigurationTarget.Global
    );
  } else {
    // Relative モード: 標準行番号を有効化
    vscode.workspace.getConfiguration().update(
      'editor.lineNumbers',
      'on',
      vscode.ConfigurationTarget.Global
    );
  }

  // ...以下のコード...
}
```

#### 4. イベントリスナーで動的に切り替え
```typescript
const selectionListener =
  vscode.window.onDidChangeTextEditorSelection((event) => {
    const editor = event.textEditor;
    const mode = config.getLineNumberMode();
    
    if (mode === 'hybrid') {
      decorations.showHybridLineNumbers(editor);
    } else {
      decorations.showRelativeLineNumbers(editor);
    }
    
    modeController?.handleSelectionChange();
  });
```

---

### 推奨実装戦略

| 方法 | 難易度 | パフォーマンス | カスタマイズ性 | 推奨用途 |
|-----|--------|--------------|--------------|---------|
| 方法1（標準行番号) | ⭐ 低 | ⭐⭐⭐ 高 | ⭐ 低 | シンプルな機能が必要な場合 |
| 方法2（完全カスタム) | ⭐⭐⭐ 高 | ⭐⭐ 中 | ⭐⭐⭐ 高 | 細かいカスタマイズが必要 |
| 方法3（設定で切り替え) | ⭐⭐ 中 | ⭐⭐ 中 | ⭐⭐ 中 | ユーザーの選択を尊重 |

**最初は方法1から始めることをお勧めします。** VS Code の標準行番号表示は最適化されており、パフォーマンスが良好です。将来、さらなるカスタマイズが必要になったら方法3へ移行できます。

---

### テスト方法

1. 実装後、`npm run compile` でコンパイル
2. F5 で拡張を起動
3. ファイルを開いて、行番号領域を確認
4. カーソルを移動して、相対行番号が更新されることを確認
5. デベロッパーツール（Cmd+Shift+I → Console）でログを確認

---

## 今後の拡張案

1. **設定オプション追加**
   - 相対行番号の色・フォント・ウェイトを個別設定
   - Hybrid mode（絶対 + 相対を同時表示）✅ 実装ガイド追加

2. **モード別制御**
   - Insert モードでも相対行番号表示オプション

3. **パフォーマンス改善**
   - Worker スレッド化（重い計算を別スレッドで実行）
   - SVG キャッシュの永続化

---

## 参考資料

- [VS Code Extensions API](https://code.visualstudio.com/api)
- [TextEditorDecorationType](https://code.visualstudio.com/api/references/vscode-api#TextEditorDecorationType)
- [Data URIs - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs)

