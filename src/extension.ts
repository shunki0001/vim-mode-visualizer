import * as vscode from 'vscode';

let statusBarItem: vscode.StatusBarItem;
let lastMode: string | undefined;

// ===== Line Decorations =====
let normalLineDecoration: vscode.TextEditorDecorationType;
let insertLineDecoration: vscode.TextEditorDecorationType;
let visualLineDecoration: vscode.TextEditorDecorationType;
let visualBlockDecoration: vscode.TextEditorDecorationType;

export function activate(context: vscode.ExtensionContext) {

  // ===== Status Bar =====
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Righ/t,
    100
  );
  statusBarItem.show();

  // ===== Decorations =====
  normalLineDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
    isWholeLine: true,
  });

  insertLineDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    isWholeLine: true,
  });

  visualLineDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    isWholeLine: true,
  });

  visualBlockDecoration = vscode.window.createTextEditorDecorationType({
  backgroundColor: 'rgba(255, 152, 0, 0.12)',

  before: {
    contentText: '▌',
    color: 'rgba(255, 152, 0, 0.9)',
    margin: '0 4px 0 0',
  },
});

  // ===== Command =====
  const showMode = vscode.commands.registerCommand(
    'vim-mode-visualizer.showMode',
    (mode: string) => {
      if (mode === lastMode) return;
      lastMode = mode;

      vscode.window.showInformationMessage(getPopupText(mode));
      updateLineHighlight(mode);

      statusBarItem.text = `$(keyboard) ${mode}`;
      statusBarItem.backgroundColor = getStatusBarBackground(mode);
      statusBarItem.tooltip = `Current Vim Mode: ${mode}`;
    }
  );

  // ===== Selection Change (ONLY ONCE) =====
  const selectionListener =
    vscode.window.onDidChangeTextEditorSelection(() => {
      if (!lastMode) return;
      updateLineHighlight(lastMode);
    });

  context.subscriptions.push(
    showMode,
    selectionListener,
    statusBarItem,
    normalLineDecoration,
    insertLineDecoration,
    visualLineDecoration,
    visualBlockDecoration
  );
}

export function deactivate() {
  normalLineDecoration.dispose();
  insertLineDecoration.dispose();
  visualLineDecoration.dispose();
  visualBlockDecoration.dispose();
}

// =======================================================
// ===================== Helpers ==========================
// =======================================================

function updateLineHighlight(mode: string) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  // Clear all
  editor.setDecorations(normalLineDecoration, []);
  editor.setDecorations(insertLineDecoration, []);
  editor.setDecorations(visualLineDecoration, []);
  editor.setDecorations(visualBlockDecoration, []);

  // VISUAL BLOCK → vertical band
  if (mode === 'VISUAL_BLOCK') {
    editor.setDecorations(
      visualBlockDecoration,
      getVisualBlockRanges(editor)
    );
    return;
  }

  // VISUAL / VISUAL_LINE → whole selected lines
  if (isVisualMode(mode)) {
    editor.setDecorations(
      visualLineDecoration,
      getSelectedLineRanges(editor)
    );
    return;
  }

  // NORMAL / INSERT → cursor line
  const line = editor.selection.active.line;
  const range = editor.document.lineAt(line).range;

  if (mode === 'INSERT') {
    editor.setDecorations(insertLineDecoration, [range]);
  } else {
    editor.setDecorations(normalLineDecoration, [range]);
  }
}

function isVisualMode(mode: string): boolean {
  return (
    mode === 'VISUAL' ||
    mode === 'VISUAL_LINE' ||
    mode === 'VISUAL_BLOCK'
  );
}

function getSelectedLineRanges(
  editor: vscode.TextEditor
): vscode.Range[] {
  const ranges: vscode.Range[] = [];

  for (const sel of editor.selections) {
    const start = Math.min(sel.start.line, sel.end.line);
    const end = Math.max(sel.start.line, sel.end.line);

    for (let line = start; line <= end; line++) {
      ranges.push(editor.document.lineAt(line).range);
    }
  }
  return ranges;
}

function getVisualBlockRanges(
  editor: vscode.TextEditor
): vscode.Range[] {
  const ranges: vscode.Range[] = [];

  for (const sel of editor.selections) {
    const startLine = Math.min(sel.start.line, sel.end.line);
    const endLine = Math.max(sel.start.line, sel.end.line);
    const startCol = Math.min(sel.start.character, sel.end.character);
    const endCol = Math.max(sel.start.character, sel.end.character);

    for (let line = startLine; line <= endLine; line++) {
      ranges.push(
        new vscode.Range(line, startCol, line, endCol)
      );
    }
  }
  return ranges;
}

function getPopupText(mode: string): string {
  switch (mode) {
    case 'INSERT':
      return '🟢 ▶ INSERT MODE ◀';
    case 'VISUAL':
    case 'VISUAL_LINE':
      return '🟧 ▶ VISUAL MODE ◀';
    case 'VISUAL_BLOCK':
      return '🟧 ▶ VISUAL BLOCK ◀';
    case 'REPLACE':
      return '🔴 ▶ REPLACE MODE ◀';
    default:
      return '🔵 ▶ NORMAL MODE ◀';
  }
}

function getStatusBarBackground(mode: string): vscode.ThemeColor {
  switch (mode) {
    case 'INSERT':
      return new vscode.ThemeColor('vimModeVisualizer.insert');
    case 'VISUAL':
    case 'VISUAL_LINE':
    case 'VISUAL_BLOCK':
      return new vscode.ThemeColor('vimModeVisualizer.visual');
    default:
      return new vscode.ThemeColor('vimModeVisualizer.normal');
  }
}
