import * as vscode from 'vscode';
import { VimMode } from './mode';
import { DecorationManager } from './decorationManager';
import { ConfigService } from './configService';
import { ModeController } from './modeController';

// ===== Line Decorations =====
let normalLineDecoration: vscode.TextEditorDecorationType;
let insertLineDecoration: vscode.TextEditorDecorationType;
let visualLineDecoration: vscode.TextEditorDecorationType;
let visualBlockDecoration: vscode.TextEditorDecorationType;

const decorations = new DecorationManager();

export function activate(context: vscode.ExtensionContext) {

  // ===== Status Bar =====
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBar.show();

  const decorations = new DecorationManager();
  const configService = new ConfigService();

  const modeController = new ModeController(
    statusBar,
    decorations,
    configService
  );

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
    backgroundColor: 'rgba(255, 152, 0, 0.25)',
  });

  visualBlockDecoration = vscode.window.createTextEditorDecorationType({
  backgroundColor: 'rgba(255, 152, 0, 0.15)',

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
      const vimMode = toVimMode(mode);
      if (!vimMode) {
        return;
      }

      modeController.setMode(vimMode);
    }
  );

  // ===== Selection Change (ONLY ONCE) =====
  const selectionListener =
    vscode.window.onDidChangeTextEditorSelection(() => {
      modeController.handleSelectionChange();
    });

  context.subscriptions.push(
    showMode,
    selectionListener,
    statusBar
  );

  const configListener =
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('vimModeVisualizer.enableNotification')) {
        console.log('Notification setting changed');
      }
    });

  context.subscriptions.push(configListener);
}

export function deactivate() {
  decorations.dispose();
}

// ===================== Helpers ==========================

function toVimMode(value: string): VimMode | null {
  return Object.values(VimMode).includes(value as VimMode)
    ? (value as VimMode)
    : null;
}
