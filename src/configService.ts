import * as vscode from 'vscode';

export class ConfigService {
    private config = vscode.workspace.getConfiguration('vimModeVisualizer');

    isNotificationEnabled() {
        return this.config.get<boolean>('enableNotification', true);
    }
    
    isInlineEnabled() {
        return this.config.get<boolean>('enableInline', true);
    }

    isRelativeLineEnabled(): boolean {
        return vscode.workspace
            .getConfiguration('vimModeVisualizer')
            .get('relativeLineNumbers', true);
    }
}