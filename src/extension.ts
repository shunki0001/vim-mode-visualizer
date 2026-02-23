import * as vscode from 'vscode';
import { DecorationManager } from './decorationManager';
import { ConfigService } from './configService';
import { ModeController } from './modeController';

let modeController: ModeController | undefined;

export function activate(context: vscode.ExtensionContext) {

  const decorations = new DecorationManager();
  const configService = new ConfigService();

  modeController = new ModeController(
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
    vscode.window.onDidChangeTextEditorSelection((event) => {
      modeController?.handleSelectionChange();
    });

  context.subscriptions.push(
    showMode,
    selectionListener,
    modeController
  );

  const updateNumbers = () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    decorations.showHybridLineNumbers(editor);
  }

  updateNumbers();

  const cursorListener = 
    vscode.window.onDidChangeTextEditorSelection(() => {
      updateNumbers();
    });

  context.subscriptions.push(cursorListener);
}
