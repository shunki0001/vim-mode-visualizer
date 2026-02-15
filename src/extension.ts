import * as vscode from 'vscode';
import { DecorationManager } from './decorationManager';
import { ConfigService } from './configService';
import { ModeController } from './modeController';

let modeController: ModeController | undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log('vim-mode-visualizer: activate');

  // Enable glyph margin for relative line numbers
  vscode.workspace.getConfiguration().update(
    'editor.glyphMargin',
    true,
    vscode.ConfigurationTarget.Global
  );

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
      console.log('selection changed');
      const editor = event.textEditor;
      decorations.showRelativeLineNumbers(editor);
      modeController?.handleSelectionChange();
    });

  const activeEditorListener = 
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        decorations.showRelativeLineNumbers(editor);
      }
    });

  const visibleRangesListener =
    vscode.window.onDidChangeTextEditorVisibleRanges((event) => {
      console.log('visible ranges changed');
      const editor = event.textEditor;
      decorations.showRelativeLineNumbers(editor);
    });

  context.subscriptions.push(
    showMode,
    selectionListener,
    activeEditorListener,
    visibleRangesListener,
    modeController
  );
}
