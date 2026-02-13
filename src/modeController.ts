import * as vscode from 'vscode';
import { MODE_CONFIG, VimMode } from './mode';
import { DecorationManager } from './decorationManager';
import { ConfigService } from './configService';

export class ModeController {
    private currentMode?: VimMode;

    constructor(
        private statusBar: vscode.StatusBarItem,
        private decorations: DecorationManager,
        private config: ConfigService
    ) {}

    setMode(mode: VimMode) {
        this.currentMode = mode;

        const editor = vscode.window.activeTextEditor;
        const config = MODE_CONFIG[mode];

        if (!config) {
            return;
        }

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

        // 4. StatusBar
        this.statusBar.text = `$(keyboard) ${mode}`
        this.statusBar.backgroundColor = config.statusBarColor;
        this.statusBar.tooltip = `Current Vim Mode: ${mode}`; 
    }

    handleSelectionChange() {
        if (!this.currentMode) {
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        this.decorations.applyModeHighlight(editor, this.currentMode);
    }
}