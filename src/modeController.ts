import * as vscode from 'vscode';
import { MODE_CONFIG, VimMode } from './mode';
import { DecorationManager } from './decorationManager';
import { ConfigService } from './configService';

export class ModeController implements vscode.Disposable {

    private currentMode?: VimMode;
    private disposables: vscode.Disposable[] = [];
    private statusBar: vscode.StatusBarItem;

    constructor(
        private decorations: DecorationManager,
        private config: ConfigService
    ) {

        this.statusBar = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );

        this.statusBar.show();
        this.disposables.push(this.statusBar);

        // ======================
        // Editor Events
        // ======================

        this.disposables.push(

            vscode.window.onDidChangeTextEditorSelection((event) => {
                const editor = event.textEditor;

                if (!editor) return;

                this.handleSelectionChange();

                // 相対行番号更新
                this.decorations.showRelativeLineNumbers(editor);
            }),

            vscode.window.onDidChangeActiveTextEditor((editor) => {
                if (!editor) return;

                if (this.currentMode) {
                    this.decorations.applyModeHighlight(editor, this.currentMode);
                }

                this.decorations.showRelativeLineNumbers(editor);
            })
        );
    }

    // ======================
    // Mode Change
    // ======================

    setMode(modeValue: string) {

        const mode = this.parseMode(modeValue);
        if (!mode) return;

        this.currentMode = mode;

        const editor = vscode.window.activeTextEditor;
        const config = MODE_CONFIG[mode];

        if (!config) return;

        // 1. Notification
        if (this.config.isNotificationEnabled()) {
            vscode.window.showInformationMessage(config.popupText);
        }

        // 2. Inline
        if (editor && this.config.isInlineEnabled()) {
            this.decorations.showInlineOnce(
                editor,
                mode,
                {
                    background: config.inlineBackground,
                    foreground: config.inlineTextColor,
                },
                300
            );
        }

        // 3. Highlight
        if (editor) {
            this.decorations.applyModeHighlight(editor, mode);
        }

        // 4. Relative Line Numbers（Normal系のみ表示がおすすめ）
        if (editor) {
            if (mode === VimMode.NORMAL || mode === VimMode.REPLACE) {
                this.decorations.showRelativeLineNumbers(editor);
            } else {
                this.decorations.clearRelativeNumbers(editor);
            }
        }

        // 5. StatusBar
        this.statusBar.text = `$(keyboard) ${mode}`;
        this.statusBar.backgroundColor = config.statusBarColor;
        this.statusBar.tooltip = `Current Vim Mode: ${mode}`;
    }

    // ======================
    // Selection Change
    // ======================

    handleSelectionChange() {

        if (!this.currentMode) return;

        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        this.decorations.applyModeHighlight(editor, this.currentMode);

        // 相対行番号も更新
        this.decorations.showRelativeLineNumbers(editor);
    }

    // ======================
    // Utils
    // ======================

    private parseMode(value: string): VimMode | null {
        return Object.values(VimMode).includes(value as VimMode)
            ? (value as VimMode)
            : null;
    }

    // ======================
    // Dispose
    // ======================

    dispose() {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
