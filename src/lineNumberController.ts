import * as vscode from "vscode";
import { LineNumberMode } from "./lineNumberMode";
import { ConfigService } from "./configService";

export class LineNumberController {
  private decorationType: vscode.TextEditorDecorationType;
  private lastActiveLine = -1;
  private lastStart = -1;
  private lastEnd = -1;
  private decorations: vscode.DecorationOptions[] = [];
  private updateTimer: NodeJS.Timeout | undefined;

  constructor(
    private configService: ConfigService
  ) {
    this.decorationType = vscode.window.createTextEditorDecorationType({
      before: {
        margin: '0 16px 0 0',
        color: '#888'
      }
    });
  }

  scheduleUpdate() {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }

    this.updateTimer = setTimeout(() => {
      this.update();
    }, 16);
  }

  update() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

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

    const mode = this.configService.getLineNumberMode();

    this.decorations.length = 0;

    if (activeLine >= start && activeLine <= end) {
      this.decorations.push({
        range: new vscode.Range(activeLine, 0, activeLine, 0),
        renderOptions: {
          before: {
            contentText: this.buildText(
              mode,
              activeLine + 1,
              0
            )
          }
        }
      });
    }

    let relative = 1;

    for (let line = activeLine -1; line >= start; line--) {
      this.decorations.push({
        range: new vscode.Range(line, 0, line, 0),
        renderOptions: {
          before: {
            contentText: this.buildText(
              mode,
              line + 1,
              relative
            )
          }
        }
      });

      relative++
    }

    relative = 1;

    for (let line = activeLine + 1; line <= end; line++) {
      this.decorations.push({
        range: new vscode.Range(line, 0, line, 0),
        renderOptions: {
          before: {
            contentText: this.buildText(
              mode,
              line + 1,
              relative
            )
          }
        }
      });

      relative++;
    }

    editor.setDecorations(this.decorationType, this.decorations);
  }

  private buildText(
    mode: LineNumberMode,
    absolute: number,
    relative: number
  ): string {
    switch (mode) {
      case LineNumberMode.Absolute:
        return `${absolute}`;

      case LineNumberMode.Relative:
        return `${relative}`;

      case LineNumberMode.Hybrid:
        return `${absolute} ${relative}`;
    }
  }
}
