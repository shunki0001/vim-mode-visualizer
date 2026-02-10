import * as vscode from 'vscode';
import { MODE_CONFIG, VimMode } from './mode';
import { DecorationManager } from './decorationManager';

let statusBarItem: vscode.StatusBarItem;
let lastMode: VimMode | undefined;
let inlineDecoration: vscode.TextEditorDecorationType | null = null;
let hideTimer: NodeJS.Timeout | null = null;

// ===== Line Decorations =====
let normalLineDecoration: vscode.TextEditorDecorationType;
let insertLineDecoration: vscode.TextEditorDecorationType;
let visualLineDecoration: vscode.TextEditorDecorationType;
let visualBlockDecoration: vscode.TextEditorDecorationType;

type HighlightStrategy = (editor: vscode.TextEditor) => void

const decorations = new DecorationManager();

const highlightStrategies: Record<VimMode, HighlightStrategy> = {
  [VimMode.NORMAL]: editor => {
    decorations.applyCursorLine(editor, decorations.normalLine);
  },

  [VimMode.INSERT]: editor => {
    decorations.applyCursorLine(editor, decorations.insertLine);
  },

  [VimMode.VISUAL]: editor => {
    decorations.applyVisualLine(editor);
  },

  [VimMode.VISUAL_LINE]: editor => {
    decorations.applyVisualLine(editor);
  },

  [VimMode.VISUAL_BLOCK]: editor => {
    decorations.applyVisualBlock(editor);
  },

  [VimMode.REPLACE]: editor => {
    decorations.applyCursorLine(editor, decorations.normalLine);
  },
};

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

      if (isNotificationEnabled()) {
        vscode.window.showInformationMessage(config.popupText);
      }
      
      const editor = vscode.window.activeTextEditor;
      if (editor && isInlineEnabled()) {
        showInlineOnce(
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

  // Clear all
  decorations.clear(editor);

  const strategy = highlightStrategies[mode];
  strategy?.(editor);
}

function createInlineDecoration(label: string, colors: { background: string; foreground: string }) {
  if (inlineDecoration) {
    inlineDecoration.dispose();
  }

  inlineDecoration = vscode.window.createTextEditorDecorationType({
    after: {
      contentText: ` ${label}`,
      color: colors.foreground,
      backgroundColor: colors.background !== 'transparent'
        ? colors.background
        :undefined,
      margin: '0 0 0 1rem',
      fontStyle: 'italic',
    },
  });

  return inlineDecoration;
}

function showInlineOnce(
  editor: vscode.TextEditor,
  label: string,
  colors: { background: string; foreground: string },
  duration: number
) {
  if (hideTimer) {
    clearTimeout(hideTimer);
  }

  const decoration = createInlineDecoration(label, colors);

  const line = editor.selection.active.line;
  const lineText = editor.document.lineAt(line).text;
  const endChar = lineText.length;

  const range = new vscode.Range(
    new vscode.Position(line, endChar),
    new vscode.Position(line, endChar),
  );

  editor.setDecorations(decoration, [range]);

  hideTimer = setTimeout(() => {
    decoration.dispose();
    inlineDecoration = null;
  }, duration);
}


function isNotificationEnabled(): boolean {
  const config = vscode.workspace.getConfiguration('vimModeVisualizer');
  return config.get<boolean>('enableNotification', true);
}

function isInlineEnabled(): boolean {
  const config = vscode.workspace.getConfiguration('vimModeVisualizer');
  return config.get<boolean>('enableInline', true);
}

function highlightCursorLine(
  editor: vscode.TextEditor,
  decoration: vscode.TextEditorDecorationType
) {
  const line = editor.selection.active.line;
  const range = editor.document.lineAt(line).range;
  editor.setDecorations(decoration, [range]);
}

function toVimMode(value: string): VimMode | null {
  return Object.values(VimMode).includes(value as VimMode)
    ? (value as VimMode)
    : null;
}
