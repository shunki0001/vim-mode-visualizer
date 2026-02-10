import * as vscode from 'vscode';

export enum VimMode {
    NORMAL = 'NORMAL',
    INSERT = 'INSERT',
    VISUAL = 'VISUAL',
    VISUAL_LINE = 'VISUAL_LINE',
    VISUAL_BLOCK = 'VISUAL_BLOCK',
    REPLACE = 'REPLACE',
}

export type ModeConfig = {
    popupText: string
    statusBarColor: vscode.ThemeColor
    inlineColor: string
    isVisual: boolean
    inlineBackground: string
    inlineTextColor: string
}

export const MODE_CONFIG: Record<VimMode, ModeConfig> = {
    [VimMode.NORMAL]: {
        popupText: '🔵 ▶ NORMAL MODE ◀',
        statusBarColor: new vscode.ThemeColor('vimModeVisualizer.normal'),
        inlineColor: '#90A4AE',
        isVisual: false,
        // inlineBackground: 'rgba(100, 100, 255, 0.8)',
        inlineBackground: 'transparent',
        inlineTextColor: '#4FC3F7',
    },
    [VimMode.INSERT]: {
        popupText: '🟢 ▶ INSERT MODE ◀',
        statusBarColor: new vscode.ThemeColor('vimModeVisualizer.insert'),
        inlineColor: '#4CAF50',
        isVisual: false,
        inlineBackground: 'rgba(100, 255, 100, 0.8)',
        inlineTextColor: '#FFFFFF',
    },
    [VimMode.VISUAL]: {
        popupText: '🟧 ▶ VISUAL MODE ◀',
        statusBarColor: new vscode.ThemeColor('vimModeVisualizer.visual'),
        inlineColor: '#FF9800',
        isVisual: true,
        inlineBackground: 'rgba(255, 165, 0, 0.8)',
        inlineTextColor: '#FFFFFF',
    },
    [VimMode.VISUAL_LINE]: {
        popupText: '🟧 ▶ VISUAL LINE ◀',
        statusBarColor: new vscode.ThemeColor('vimModeVisualizer.visual'),
        inlineColor: '#FFB74D',
        isVisual: true,
        inlineBackground: 'rgba(255, 165, 0, 0.8)',
        inlineTextColor: '#FFFFFF',
    },
    [VimMode.VISUAL_BLOCK]: {
        popupText: '🟧 ▶ VISUAL BLOCK ◀',
        statusBarColor: new vscode.ThemeColor('vimModeVisualizer.visual'),
        inlineColor: '#FFB74D',
        isVisual: true,
        inlineBackground: 'rgba(255, 165, 0, 0.8)',
        inlineTextColor: '#FFFFFF',
    },
    [VimMode.REPLACE]: {
        popupText: '🔴 ▶ REPLACE MODE ◀',
        statusBarColor: new vscode.ThemeColor('vimModeVisualizer.insert'),
        inlineColor: '#F44336',
        isVisual: false,
        inlineBackground: 'rgba(255, 100, 100, 0.8)',
        inlineTextColor: '#FFFFFF',
    },
};