import * as vscode from 'vscode';
import { DecorationManager } from './decorationManager';
import { ConfigService } from './configService';
import { ModeController } from './modeController';
import { LineNumberMode } from './lineNumberMode';

let modeController: ModeController | undefined;
let decorationType: vscode.TextEditorDecorationType;
let configService: ConfigService;

export function activate(context: vscode.ExtensionContext) {

  const decorations = new DecorationManager();
  configService = new ConfigService();

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
      updateLineNumbers();
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
  
  vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration("vimModeVisualizer.lineNumberMode")) {
      updateLineNumbers();
    }
  })

  updateLineNumbers();

  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorVisibleRanges(updateLineNumbers),
    vscode.window.onDidChangeActiveTextEditor(updateLineNumbers)
  );
}

function updateLineNumbers() {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    return;
  }
  
  const mode = configService.getLineNumberMode();

  if (mode === LineNumberMode.OFF) {
    editor.setDecorations(decorationType, []);
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

    // const text = `${absolute} ${relative}`;

    const text = buildLineNumberText(
      mode,
      absolute,
      relative
    );

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

function buildLineNumberText(
  mode: LineNumberMode,
  absolute: number,
  relative: number
): string {
  switch (mode) {
    case LineNumberMode.ABS_REL:
      return `${absolute} ${relative}`;
    case LineNumberMode.REL_ABS:
      return `${absolute} ${relative}`;
    case LineNumberMode.ABS:
      return `${absolute}`;
    case LineNumberMode.REL:
      return `${absolute}`;

    case LineNumberMode.OFF:
      return '';

    default:
      return `${absolute}`;

  }
}
