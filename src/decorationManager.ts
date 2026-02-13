import * as vscode from 'vscode';
import { getSelectedLineRanges, getVisualBlockRanges } from './ranges';
import { VimMode } from './mode';

type InlineColors = {
    background: string
    foreground: string
}

export class DecorationManager {
    private inlineDecoration?: vscode.TextEditorDecorationType;
    private hideTimer?: NodeJS.Timeout;

    showInlineOnce(
        editor: vscode.TextEditor,
        label: string,
        colors: InlineColors,
        duration: number,
    ) {
        this.inlineDecoration?.dispose();
        if (this.hideTimer) {
            clearTimeout(this.hideTimer);
        }

        this.inlineDecoration =
            vscode.window.createTextEditorDecorationType({
                after: {
                    contentText: ` ${label}`,
                    color: colors.foreground,
                    backgroundColor:
                        colors.background !== 'transparent'
                            ? colors.background
                            : undefined,
                    margin: '0 0 0 1rem',
                    fontStyle: 'italic',
                },
                // backgroundColor: colors.background,
                // color: colors.foreground,
            });
        
        const line = editor.selection.active.line;
        const endChar = editor.document.lineAt(line).text.length;

        const range = new vscode.Range(
            new vscode.Position(line, endChar),
            new vscode.Position(line, endChar)
        );

        editor.setDecorations(this.inlineDecoration, [range]);

        this.hideTimer = setTimeout(() => {
            this.inlineDecoration?.dispose();
            this.inlineDecoration = undefined;
        }, duration);

    }

    readonly normalLine: vscode.TextEditorDecorationType;
    readonly insertLine: vscode.TextEditorDecorationType;
    readonly visualLine: vscode.TextEditorDecorationType;
    readonly visualBlock: vscode.TextEditorDecorationType;
    
    constructor() {
        this.normalLine = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(33, 150, 243, 0.15)',
            isWholeLine: true,
        });
        
        this.insertLine = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(76, 175, 80, 0.15)',
            isWholeLine: true,
        });

        this.visualLine = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(255, 152, 0, 0.25)',
        });

        this.visualBlock = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(255, 152, 0, 0.15)',
            before: {
                contentText: '▌',
                color: 'rgba(255, 152, 0, 0.9)',
                margin: '0 4px 0 0',
            },
        });
    }

    clear(editor: vscode.TextEditor) {
        editor.setDecorations(this.normalLine, []);
        editor.setDecorations(this.insertLine, []);
        editor.setDecorations(this.visualLine, []);
        editor.setDecorations(this.visualBlock, []);
    }

    applyCursorLine(
        editor: vscode.TextEditor,
        decoration: vscode.TextEditorDecorationType,
    ) {
        const line = editor.selection.active.line;
        const range = editor.document.lineAt(line).range;
        editor.setDecorations(decoration, [range]);
    }

    applyVisualLine(editor: vscode.TextEditor) {
        editor.setDecorations(
            this.visualLine,
            getSelectedLineRanges(editor),
        );
    }

    applyVisualBlock(editor: vscode.TextEditor) {
        editor.setDecorations(
            this.visualBlock,
            getVisualBlockRanges(editor),
        );
    }

    dispose() {
        this.normalLine.dispose();
        this.insertLine.dispose();
        this.visualLine.dispose();
        this.visualBlock.dispose();
    }

    applyModeHighlight(editor: vscode.TextEditor, mode: VimMode) {
        this.clear(editor);

        switch(mode) {
            case VimMode.NORMAL:
            case VimMode.REPLACE:
                this.applyCursorLine(editor, this.normalLine);
                break;

            case VimMode.INSERT:
                this.applyCursorLine(editor, this.insertLine);
                break;

            case VimMode.VISUAL:
            case VimMode.VISUAL_LINE:
                this.applyVisualLine(editor);
                break;

            case VimMode.VISUAL_BLOCK:
                this.applyVisualBlock(editor);
                break;
        }
    }
}