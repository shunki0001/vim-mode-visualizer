import * as vscode from 'vscode';
import { MODE_CONFIG, VimMode } from './mode';
import { DecorationManager } from './decorationManager';
import { ConfigService } from './configService';

let statusBarItem: vscode.StatusBarItem;
let lastMode: VimMode | undefined;

// ===== Line Decorations =====
let normalLineDecoration: vscode.TextEditorDecorationType;
let insertLineDecoration: vscode.TextEditorDecorationType;
let visualLineDecoration: vscode.TextEditorDecorationType;
let visualBlockDecoration: vscode.TextEditorDecorationType;

type HighlightStrategy = (editor: vscode.TextEditor) => void

const decorations = new DecorationManager();
const configService = new ConfigService();


export function activate(context: vscode.ExtensionContext) {

  // ===== Status Bar =====
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
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
      lastMode = vimMode;

      const config = MODE_CONFIG[vimMode];

      if (configService.isNotificationEnabled()) {
        vscode.window.showInformationMessage(config.popupText);
      }
      
      const editor = vscode.window.activeTextEditor;
      if (editor && configService.isInlineEnabled()) {
        decorations.showInlineOnce(
          editor,
          mode,
          {
            background: config.inlineBackground,
            foreground: config.inlineTextColor,
          },
          300);
      }

      updateLineHighlight(vimMode);

      statusBarItem.text = `$(keyboard) ${mode}`;
      statusBarItem.backgroundColor = config.statusBarColor;
      statusBarItem.tooltip = `Current Vim Mode: ${mode}`;
    }
  );

  // ===== Selection Change (ONLY ONCE) =====
  const selectionListener =
    vscode.window.onDidChangeTextEditorSelection(() => {
      if (!lastMode) {
        return;
      }
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

function updateLineHighlight(mode: VimMode) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  decorations.applyModeHighlight(editor, mode);
}

function toVimMode(value: string): VimMode | null {
  return Object.values(VimMode).includes(value as VimMode)
    ? (value as VimMode)
    : null;
}
