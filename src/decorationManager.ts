import * as vscode from 'vscode';
import { getSelectedLineRanges, getVisualBlockRanges } from './ranges';
import { VimMode } from './mode';

type InlineColors = {
    background: string;
    foreground: string;
};

export class DecorationManager {

    private inlineDecoration?: vscode.TextEditorDecorationType;
    private hideTimer?: NodeJS.Timeout;

    private decorTypeMap: Map<vscode.TextEditor, Map<number, vscode.TextEditorDecorationType>>;
    private decorNumMap: Map<vscode.TextEditor, Map<number, number>>;
    private updateDecorDebounced!: (editor: vscode.TextEditor) => void;
    private readonly NO_DECOR = -1;

    readonly normalLine: vscode.TextEditorDecorationType;
    readonly insertLine: vscode.TextEditorDecorationType;
    readonly visualLine: vscode.TextEditorDecorationType;
    readonly visualBlock: vscode.TextEditorDecorationType;

    constructor() {
        this.decorTypeMap = new Map();
        this.decorNumMap = new Map();
        this.initializeUpdateDecorDebounced();

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

    // ========================
    // Inline label
    // ========================

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

    // ========================
    // Mode highlight
    // ========================

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

    applyModeHighlight(editor: vscode.TextEditor, mode: VimMode) {
        this.clear(editor);

        switch (mode) {
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

    // ========================
    // Relative line numbers
    // ========================

    private initializeUpdateDecorDebounced() {
        const delayTime = 50;
        this.updateDecorDebounced = this.debounce(
            this.updateRelativeLineNumbers.bind(this),
            delayTime
        );
    }

    private debounce(func: Function, wait: number, immediate: boolean = false) {
        let timeout: NodeJS.Timeout | null = null;
        return (...args: any[]) => {
            const later = () => {
                timeout = null;
                if (!immediate) {
                    func(...args);
                }
            };
            const callNow = immediate && !timeout;
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(later, wait);
            if (callNow) {
                func(...args);
            }
        };
    }

    private getSvgUri(num: number): string {
        const width = 100;
        const height = 100;
        const x = width / 2;
        const y = height / 2;
        const lengthAdjust = 'spacingAndGlyphs';
        const textAnchor = 'middle';
        const dominantBaseline = 'central';
        const fill = encodeURIComponent(
            vscode.workspace
                .getConfiguration()
                .get('vscode-double-line-numbers.font.color', '#858585')
        );
        const fontWeight = vscode.workspace
            .getConfiguration()
            .get('vscode-double-line-numbers.font.weight', '400');
        const fontFamily = vscode.workspace
            .getConfiguration()
            .get(
                'vscode-double-line-numbers.font.family',
                vscode.workspace.getConfiguration().get('editor.fontFamily', 'monospace')
            );
        const textLength = vscode.workspace
            .getConfiguration()
            .get('vscode-double-line-numbers.text.width', '80');
        const fontSize = vscode.workspace
            .getConfiguration()
            .get('vscode-double-line-numbers.text.height', '75');

        return `data:image/svg+xml;utf8,<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><text x="${x}" y="${y}" textLength="${textLength}" lengthAdjust="${lengthAdjust}" font-weight="${fontWeight}" font-size="${fontSize}" font-family="${fontFamily}" fill="${fill}" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}">${num
            .toString()
            .padStart(3, '\u00A0')}</text></svg>`;
    }

    private createDecorType(num: number): vscode.TextEditorDecorationType {
        if (num > 0) {
            return vscode.window.createTextEditorDecorationType({
                gutterIconPath: vscode.Uri.parse(this.getSvgUri(num)),
                gutterIconSize: 'cover',
            });
        } else {
            return vscode.window.createTextEditorDecorationType({});
        }
    }

    private updateRelativeLineNumbers(editor: vscode.TextEditor) {
        console.log('updateRelativeLineNumbers called');

        const start = Math.max(editor.visibleRanges[0].start.line - 1, 0);
        const end = Math.min(
            editor.visibleRanges[0].end.line + 1,
            editor.document.lineCount - 1
        );
        const activeLine = editor.selection.active.line;

        if (!this.decorTypeMap.has(editor)) {
            this.decorTypeMap.set(editor, new Map());
        }
        if (!this.decorNumMap.has(editor)) {
            this.decorNumMap.set(editor, new Map());
        }

        for (let i = start; i <= end; ++i) {
            const num = Math.abs(activeLine - i);

            if (this.decorNumMap.get(editor)!.get(i) !== num) {
                this.decorTypeMap.get(editor)!.get(i)?.dispose();
                this.decorTypeMap.get(editor)!.set(i, this.createDecorType(num));
                this.decorNumMap.get(editor)!.set(i, num);
            }
        }

        for (let i = start; i <= end; ++i) {
            if (this.decorNumMap.get(editor)!.has(i)) {
                editor.setDecorations(this.decorTypeMap.get(editor)!.get(i)!, [
                    new vscode.Range(i, 0, i, 0),
                ]);
            }
        }
    }

    showRelativeLineNumbers(editor: vscode.TextEditor) {
        console.log('RELATIVE CALLED');
        this.updateDecorDebounced(editor);
    }

    clearRelativeNumbers(editor: vscode.TextEditor) {
        if (!this.decorTypeMap.has(editor)) return;

        this.decorTypeMap.get(editor)!.forEach((decor) => {
            decor.dispose();
        });
        this.decorTypeMap.delete(editor);
        this.decorNumMap.delete(editor);
    }

    private createRelativeLineDecoration() {
        // No longer needed with SVG approach
    }

    // ========================
    // Dispose
    // ========================

    dispose() {
        this.normalLine.dispose();
        this.insertLine.dispose();
        this.visualLine.dispose();
        this.visualBlock.dispose();
        this.inlineDecoration?.dispose();

        this.decorTypeMap.forEach((decorMap) => {
            decorMap.forEach((decor) => {
                decor.dispose();
            });
        });
        this.decorTypeMap.clear();
        this.decorNumMap.clear();
    }
}
