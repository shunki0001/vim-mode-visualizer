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


    createLineNumberDecoration(num: number) {
        return vscode.window.createTextEditorDecorationType({
            gutterIconPath: vscode.Uri.parse(getSvgUri(num)),
            gutterIconSize: "contain",
        });
    }

    showHybridLineNumbers(editor: vscode.TextEditor) {
        const cursorLine = editor.selection.active.line;
        const lineCount = editor.document.lineCount;

        const decorationMap = new Map<number, vscode.TextEditorDecorationType>();

        for (let i = 0; i < lineCount; i++) {
            const relative = Math.abs(i - cursorLine);
            const numberToShow = (i === cursorLine)
                ? (i + 1)   // カーソル行(絶対)
                : relative; // それ以外(相対)
            
                let deco = decorationMap.get(numberToShow);

                if (!deco) {
                    deco = this.createLineNumberDecoration(numberToShow);
                    decorationMap.set(numberToShow, deco);
                }

                const range = new vscode.Range(i, 0, i, 0);
                editor.setDecorations(deco, [{range}]);
        }
    }
}

function getSvgUri(num: number) {
    return `data:image/svg+xml;utf8,
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-size="60" fill="#888">${num}</text>
    </svg>`;
}