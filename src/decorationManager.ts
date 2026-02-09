import * as vscode from 'vscode';
import { getSelectedLineRanges, getVisualBlockRanges } from './ranges';

type InlineColors = {
    background: string
    foreground: string
}

export class DecorationManager {
    private inlineDecoration?: vscode.TextEditorDecorationType;

    showInlineOnce(
        editor: vscode.TextEditor,
        colors: InlineColors,
        duration: number,
    ) {
        this.inlineDecoration?.dispose();

        this.inlineDecoration =
            vscode.window.createTextEditorDecorationType({
                backgroundColor: colors.background,
                color: colors.foreground,
            });

        editor.setDecorations(this.inlineDecoration, [
            new vscode.Range(
                editor.selection.active,
                editor.selection.active,
            ),
        ]);

        setTimeout(() => {
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
}