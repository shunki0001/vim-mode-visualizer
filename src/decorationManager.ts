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
    private decorNumMap: Map<vscode.TextEditor, Map<number, string | number>>;
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

        // 設定変更時にdebounce再初期化
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('vimModeVisualizer.delay') ||
                e.affectsConfiguration('vimModeVisualizer.font') ||
                e.affectsConfiguration('vimModeVisualizer.text')) {
                this.initializeUpdateDecorDebounced();
                // 全エディタの装飾をクリアして再生成
                this.decorTypeMap.forEach((decorMap) => {
                    decorMap.forEach((decor) => {
                        decor.dispose();
                    });
                });
                this.decorTypeMap.clear();
                this.decorNumMap.clear();
            }
        });

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
        const delayTime = vscode.workspace
            .getConfiguration()
            .get('vimModeVisualizer.delay', 50);
        // 相対行のみ表示するようにupdateRelativeLineNumbersを使用
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

    private getSvgUri(num: number, isActive: boolean = false): string {

        const config = vscode.workspace.getConfiguration('editor');

        const fontSize = Number(config.get('fontSize', 14));
        const lineHeight = Number(config.get('lineHeight', 0)) || Math.round(fontSize * 1.6);
        const fontFamily = config.get('fontFamily', 'monospace');

        const width = 40 + String(num).length * fontSize * 0.6; // 桁数で自動幅
        const height = lineHeight;

        const x = width - 4;
        const y = height / 2;

        const color = isActive
            ? "#cccccc"     // カーソル行(絶対行)
            : "#858585";    // 相対行
        
        const fontWeight = isActive
            ? "600"
            : "400";

        const lineNumber = String(num);

        const fill = vscode.workspace
            .getConfiguration()
            .get('vimModeVisualizer.font.color.relative', '#858585');

        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg"
            width="${width}"
            height="${height}"
            viewBox="0 0 ${width} ${height}">
        <text
            x="${width - 4}"
            y="${height / 2}"
            dominant-baseline="middle"
            text-anchor="end"
            font-size="${fontSize * 1.2}px"
            fill="${color}"
            font-family="${fontFamily}"
            font-weight="${fontWeight}"
        >
            ${lineNumber}
        </text>
        </svg>
        `;

        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }

    private createDecorType(num: number): vscode.TextEditorDecorationType {
        if (num > 0) {
            return vscode.window.createTextEditorDecorationType({
                gutterIconPath: vscode.Uri.parse(this.getSvgUri(num)),
                gutterIconSize: '100%',
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

        // 前回のデコレーションをすべてクリア
        const prevDecorTypes = this.decorTypeMap.get(editor)!;
        prevDecorTypes.forEach((decor) => {
            decor.dispose();
        });
        prevDecorTypes.clear();
        this.decorNumMap.get(editor)!.clear();

        for (let i = start; i <= end; ++i) {
            const num = Math.abs(activeLine - i);
            this.decorTypeMap.get(editor)!.set(i, this.createDecorType(num));
            this.decorNumMap.get(editor)!.set(i, num);
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
        // 相対行のみ表示する実装で debounce を適用
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
