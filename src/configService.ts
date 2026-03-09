import * as vscode from 'vscode';
import { LineNumberMode } from './lineNumberMode';

export class ConfigService {
    private config = vscode.workspace.getConfiguration('vimModeVisualizer');

    isNotificationEnabled() {
        return this.config.get<boolean>('enableNotification', true);
    }
    
    isInlineEnabled() {
        return this.config.get<boolean>('enableInline', true);
    }
    getLineNumberMode(): LineNumberMode {
        const config = vscode.workspace.getConfiguration(
            "vimModeVisualizer"
        );
        
        return config.get<LineNumberMode>(
            "lineNumberMode",
            LineNumberMode.Absolute
        );
    }
}
