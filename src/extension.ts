import * as vscode from 'vscode';
import { DecorationManager } from './decorationManager';
import { ConfigService } from './services/configService';
import { ModeController } from './controller/modeController';
import { LineNumberMode } from './models/lineNumberMode';
import { LineNumberController } from './controller/lineNumberController';

export function activate(context: vscode.ExtensionContext) {

  const decorationManager = new DecorationManager();
  const configService = new ConfigService();

  const modeController = new ModeController(
    decorationManager,
    configService
  );

  const lineNumberController = new LineNumberController(configService);

  // ===== Command =====
  const showMode = vscode.commands.registerCommand(
    'vim-mode-visualizer.showMode',
    (mode: string) => {
      modeController.setMode(mode);
    }
  );

  // ===== Selection Change (ONLY ONCE) =====
  const selectionListener =
    vscode.window.onDidChangeTextEditorSelection(() => {
      modeController.handleSelectionChange();
      lineNumberController.scheduleUpdate();
    });

    context.subscriptions.push(
      showMode,
      selectionListener,
      modeController
    );

    context.subscriptions.push(
      vscode.window.onDidChangeTextEditorVisibleRanges(() =>
        lineNumberController.scheduleUpdate()
      ),
      vscode.window.onDidChangeActiveTextEditor(() =>
        lineNumberController.scheduleUpdate()
      )
    );
  
  // Config change
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("vimModeVisualize.lineNumberMode")) {
        lineNumberController.scheduleUpdate();
      }
    })
  );

  // LineNumber Mode Command
  const disposable = vscode.commands.registerCommand(
    "lineNumberMode.setLineNumberMode",
    async () => {
      const modes = Object.values(LineNumberMode);

      const selected = await vscode.window.showQuickPick(modes, {
        placeHolder: "Select line number mode"
      });

      if (!selected) {
        return;
      }
      
      const config = vscode.workspace.getConfiguration("vimModeVisualizer");

      await config.update(
        "lineNumberMode",
        selected,
        vscode.ConfigurationTarget.Global
      );
    }
  );

  context.subscriptions.push(disposable);

  lineNumberController.scheduleUpdate();
}
