import * as vscode from "vscode";
import { ConfigService } from "../services/configService";
import { LineNumberRenderer } from "../renderer/lineNumberRenderer";

export class LineNumberController {

    private renderer = new LineNumberRenderer();
    private updateTimer: NodeJS.Timeout | undefined;

    private lastActiveLine = -1;
    private lastStart = -1;
    private lastEnd = -1;

    constructor(
        private configService: ConfigService
    ) {}

    scheduleUpdate() {

        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
        }

        this.updateTimer = setTimeout(() => {
            this.update();
        }, 16);
    }

    private update() {

        const editor = vscode.window.activeTextEditor;

        if (!editor) return;

        const activeLine = editor.selection.active.line;

        const visibleRange = editor.visibleRanges[0];

        const start = visibleRange.start.line;
        const end = visibleRange.end.line;

        if (
            activeLine === this.lastActiveLine &&
            start === this.lastStart &&
            end === this.lastEnd
        ) {
            return;
        }

        this.lastActiveLine = activeLine;
        this.lastStart = start;
        this.lastEnd = end;

        const mode =
            this.configService.getLineNumberMode();

        this.renderer.render(
            editor,
            mode,
            activeLine,
            start,
            end
        );
    }
}