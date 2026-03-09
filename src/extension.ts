import * as vscode from 'vscode';
import { DecorationManager } from './decorationManager';
import { ConfigService } from './configService';
import { ModeController } from './modeController';
import { LineNumberMode } from './lineNumberMode';

let modeController: ModeController | undefined;
let decorationType: vscode.TextEditorDecorationType;
let configService: ConfigService;
let lastActiveLine = -1;
let lastStart = -1;
let lastEnd = -1;
let decorations: vscode.DecorationOptions[] = [];
let updateTimer: NodeJS.Timeout | undefined;

export function activate(context: vscode.ExtensionContext) {

  const decorationManager = new DecorationManager();
  const disposable = vscode.commands.registerCommand(
    "lineNumberMode.setLineNumberMode",
    async () => {
      const modes = Object.values(LineNumberMode);

      const selected = await vscode.window.showQuickPick(modes, {
        placeHolder: "Select line number mode"
      });

      if (!selected) {
        return;
      }
      
      const config = vscode.workspace.getConfiguration("vimModeVisualizer");

      await config.update(
        "lineNumberMode",
        selected,
        vscode.ConfigurationTarget.Global
      );
    }
  );

  context.subscriptions.push(disposable);

  configService = new ConfigService();

  modeController = new ModeController(
    decorationManager,
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
      // updateLineNumbers();
      scheduleUpdate();
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
    // vscode.window.onDidChangeTextEditorVisibleRanges(updateLineNumbers),
    vscode.window.onDidChangeTextEditorVisibleRanges(scheduleUpdate),
    // vscode.window.onDidChangeActiveTextEditor(updateLineNumbers)
    vscode.window.onDidChangeActiveTextEditor(scheduleUpdate)
  );
}

function updateLineNumbers() {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    return;
  }
  
  // const mode = configService.getLineNumberMode();

  const activeLine = editor.selection.active.line;
  const visibleRange = editor.visibleRanges[0];

  const start = visibleRange.start.line;
  const end = visibleRange.end.line;

  if (
    activeLine === lastActiveLine &&
    start === lastStart &&
    end === lastEnd
  ) {
    return;
  }

  lastActiveLine = activeLine;
  lastStart = start;
  lastEnd = end;

  // const decorations: vscode.DecorationOptions[] = [];

  decorations.length = 0;

  for (let line = start; line <= end; line++) {
    const absolute = line + 1;
    // const relative = Math.abs(activeLine - line);
    const relative =
      line > activeLine
        ? line - activeLine
        : activeLine - line;

    const text = `${absolute} ${relative}`;
  
  //   const text = buildLineNumberText(
  //     mode,
  //     absolute,
  //     relative
  //   );

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
    case LineNumberMode.Absolute:
      return `${absolute}`;

    case LineNumberMode.Relative:
      return `${relative}`;

    case LineNumberMode.Hybrid:
      return `${absolute} ${relative}`;
  }
}

function scheduleUpdate() {
  if (updateTimer) {
    clearTimeout(updateTimer);
  }
  
  updateTimer = setTimeout(() => {
    updateLineNumbers();
  }, 16);
}