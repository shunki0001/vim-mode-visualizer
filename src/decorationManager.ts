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
    private absoluteLineNumbers: vscode.TextEditorDecorationType;
    // private relativeDecoration: vscode.TextEditorDecorationType;

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

        this.absoluteLineNumbers = vscode.window.createTextEditorDecorationType({
            before: {
                color: "#888",
                margin: "0 12px 0 0"
            }
        });

        // this.relativeDecoration = vscode.window.createTextEditorDecorationType({
        //     before: {
        //         color: "#888",
        //         margin: "0 12px 0 0"
        //     } 
        // });
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
        this.absoluteLineNumbers.dispose();
        // this.relativeDecoration.dispose();
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

        showAbsoluteNumbers(editor: vscode.TextEditor) {
            const decorations: vscode.DecorationOptions[] = [];

            for (let i = 0; i < editor.document.lineCount; i++) {
                const line = editor.document.lineAt(i);

                decorations.push({
                    range: line.range,
                    renderOptions: {
                        before: {
                            contentText: String(i + 1)
                        }
                    }
                });
            }

            editor.setDecorations(this.absoluteLineNumbers, decorations);
        }

    // showRelativeNumbers(editor: vscode.TextEditor) {
    //     const decorations: vscode.DecorationOptions[] = [];
    //     const cursorLine = editor.selection.active.line;

    //     const maxDigits = String(editor.document.lineCount).length;
    //     const offsetCh =  maxDigits + 2;
    //     const gap = 1; 

    //     for (let i = 0; i < editor.document.lineCount; i++) {
    //         // if (i === cursorLine) {
    //         //     continue;
    //         // }

    //         const line = editor.document.lineAt(i);
    //         const relative = Math.abs(i - cursorLine);
            
    //         decorations.push({
    //             range: line.range,
    //             renderOptions: {
    //                 before: {
    //                     // contentText: String(relative),
    //                     contentText: String(relative).padStart(maxDigits, ' '),
    //                     width: `${offsetCh}ch`,
    //                     margin: `0 0 0 -${offsetCh}ch`,
    //                     color: "#888",
    //                     textDecoration: "none; text-align: right;"
    //                 }
    //             }
    //         });
    //     }

    //     editor.setDecorations(this.relativeDecoration, decorations);
    // }
    

}
