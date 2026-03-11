import * as vscode from "vscode";
import { LineNumberMode } from "../models/lineNumberMode";

export class LineNumberRenderer {

    private decorationType: vscode.TextEditorDecorationType;

    constructor() {
        this.decorationType = vscode.window.createTextEditorDecorationType({
            before: {
                margin: '0 16px 0 0',
                color: '#888',
                width: '60px'
            }
        });
    }

    render(
        editor: vscode.TextEditor,
        mode: LineNumberMode,
        activeLine: number,
        start: number,
        end: number
    ) {

        const decorations: vscode.DecorationOptions[] = [];

        if (activeLine >= start && activeLine <= end) {
            decorations.push({
                range: new vscode.Range(activeLine, 0, activeLine, 0),
                renderOptions: {
                    before: {
                        contentText: this.buildText(
                            mode,
                            activeLine + 1,
                            0,
                            end
                        )
                    }
                }
            });
        }

        let relative = 1;

        for (let line = activeLine - 1; line >= start; line--) {

            decorations.push({
                range: new vscode.Range(line, 0, line, 0),
                renderOptions: {
                    before: {
                        contentText: this.buildText(
                            mode,
                            line + 1,
                            relative,
                            end
                        )
                    }
                }
            });

            relative++;
        }

        relative = 1;

        for (let line = activeLine + 1; line <= end; line++) {

            decorations.push({
                range: new vscode.Range(line, 0, line, 0),
                renderOptions: {
                    before: {
                        contentText: this.buildText(
                            mode,
                            line + 1,
                            relative,
                            end
                        )
                    }
                }
            });

            relative++;
        }

        editor.setDecorations(this.decorationType, decorations);
    }

    private buildText(
        mode: LineNumberMode,
        absolute: number,
        relative: number,
        end: number
    ): string {
        
        const maxLineDigits = end.toString().length;
        
        const abs = absolute.toString().padStart(maxLineDigits, " ");
        const rel = relative.toString().padStart(maxLineDigits - 1, " ");

        switch (mode) {

            case LineNumberMode.Absolute:
                return `${abs}`;

            case LineNumberMode.Relative:
                return `${rel}`;

            case LineNumberMode.Hybrid:
                return `${abs} ${rel}`;
        }
    }
}