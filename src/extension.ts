import * as vscode from 'vscode';
import { DecorationManager } from './decorationManager';
import { ConfigService } from './configService';
import { ModeController } from './modeController';

let modeController: ModeController | undefined;
let decorationType: vscode.TextEditorDecorationType;

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
    vscode.window.onDidChangeTextEditorSelection(() => {
      modeController?.handleSelectionChange();
    });

  context.subscriptions.push(
    showMode,
    selectionListener,
    modeController
  );
  
  decorationType = vscode.window.createTextEditorDecorationType({
    before: {
      margin: '0 16px 0 0',
      color: '#888'
    }
  });

  updateLineNumbers();

  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection(updateLineNumbers),
    vscode.window.onDidChangeTextEditorVisibleRanges(updateLineNumbers),
    vscode.window.onDidChangeActiveTextEditor(updateLineNumbers)
  );
}

function updateLineNumbers() {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    return;
  }
  
  const activeLine = editor.selection.active.line;
  const visibleRange = editor.visibleRanges[0];

  const start = visibleRange.start.line;
  const end = visibleRange.end.line;

  const decorations: vscode.DecorationOptions[] = [];

  for (let line = start; line <= end; line++) {
    const absolute = line + 1;
    const relative = Math.abs(activeLine - line);

    const text = `${absolute} ${relative}`;

    // const text = 
    //   absolute.toString().padStart(4, ' ') +
    //   ' ' +
    //   relative.toString().padStart(3, ' ');

    decorations.push({
      range: new vscode.Range(line, 0, line, 0),
      renderOptions: {
        before: {
          contentText: text
        },
      }
    });
  }

  editor.setDecorations(decorationType, decorations);
}
