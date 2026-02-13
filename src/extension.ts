import * as vscode from 'vscode';
import { DecorationManager } from './decorationManager';
import { ConfigService } from './configService';
import { ModeController } from './modeController';

let modeController: ModeController | undefined;

export function activate(context: vscode.ExtensionContext) {

  // ===== Status Bar =====
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBar.show();

  const decorations = new DecorationManager();
  const configService = new ConfigService();

  modeController = new ModeController(
    statusBar,
    decorations,
    configService
  );

  // ===== Command =====
  const showMode = vscode.commands.registerCommand(
    'vim-mode-visualizer.showMode',
    (mode: string) => {
      modeController?.setMode(mode);
    }
  );

  // ===== Selection Change (ONLY ONCE) =====
  const selectionListener =
    vscode.window.onDidChangeTextEditorSelection(() => {
      modeController?.handleSelectionChange();
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
  modeController?.dispose();
}
