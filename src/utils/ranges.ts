import * as vscode from 'vscode';

export function getSelectedLineRanges(
    editor: vscode.TextEditor
): vscode.Range[] {
    const ranges: vscode.Range[] = [];

        for (const sel of editor.selections) {
            const start = Math.min(sel.start.line, sel.end.line);
            const end = Math.max(sel.start.line, sel.end.line);

        for (let line = start; line <= end; line++) {
            ranges.push(editor.document.lineAt(line).range);
        }
    }
    return ranges;
}

export function getVisualBlockRanges(
    editor: vscode.TextEditor
): vscode.Range[] {
    const ranges: vscode.Range[] = [];

    for (const sel of editor.selections) {
        const startLine = Math.min(sel.start.line, sel.end.line);
        const endLine = Math.max(sel.start.line, sel.end.line);
        const startCol = Math.min(sel.start.character, sel.end.character);
        const endCol = Math.max(sel.start.character, sel.end.character);

        for (let line = startLine; line <= endLine; line++) {
        ranges.push(
            new vscode.Range(line, startCol, line, endCol)
        );
        }
    }
    return ranges;
}