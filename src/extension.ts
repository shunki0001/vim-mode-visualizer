import * as vscode from 'vscode';

let statusBarItem: vscode.StatusBarItem;
let lastMode: string | undefined;

export function activate(context: vscode.ExtensionContext) {

  // ステータスバー作成
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.show();

  const showMode = vscode.commands.registerCommand(
  'vim-mode-visualizer.showMode',
  (mode: string) => {

    // 同じモードなら何もしない（最重要）
    if (mode === lastMode) {
      return;
    }
    lastMode = mode;

    // ===== 通知（短く・強調）=====
    vscode.window.showInformationMessage(getPopupText(mode));

    // ===== ステータスバー（常時表示）=====
    statusBarItem.text = `$(keyboard) ${mode}`;
    statusBarItem.color = getStatusBarColor(mode);
    statusBarItem.tooltip = `Current Vim Mode: ${mode}`;
  }
);


  context.subscriptions.push(showMode, statusBarItem);
}

export function deactivate() {}

function getPopupText(mode: string): string {
  switch (mode) {
    case 'INSERT':
      return '🟢 ▶ INSERT MODE ◀';
    case 'VISUAL':
      return '🟧 ▶ VISUAL MODE ◀';
    case 'REPLACE':
      return '🔴 ▶ REPLACE MODE ◀';
    default:
      return '🔵 ▶ NORMAL MODE ◀';
  }
}

function getStatusBarColor(mode: string): string | undefined {
  switch (mode) {
    case 'INSERT':
      return '#4CAF50'; // green
    case 'VISUAL':
      return '#FF9800'; // orange
    case 'REPLACE':
      return '#F44336'; // red
    default:
      return '#2196F3'; // blue
  }
}
