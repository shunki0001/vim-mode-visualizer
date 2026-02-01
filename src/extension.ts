// import * as vscode from 'vscode';

// let lastMode: string | undefined;

// export function activate(context: vscode.ExtensionContext) {

// 	console.log('vim-mode-visualizer activated');

// 	const interval = setInterval(async () => {
// 		const mode = await vscode.commands.executeCommand<string>(
// 		'getContextKeyValue',
// 		'vim.mode'
// 		);

// 		if (!mode) return;

// 		if (mode !== lastMode) {
// 		lastMode = mode;

// 		vscode.window.showInformationMessage(`VIM: ${mode.toUpperCase()}`);
// 		}
// 	}, 300); // 300ms

// 	context.subscriptions.push({
// 		dispose() {
// 		clearInterval(interval);
// 		}
// 	});
// }

// export function deactivate() {}

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

  const showMode = vscode.commands.registerCommand(
    'vim-mode-visualizer.showMode',
    (mode: string) => {
      vscode.window.showInformationMessage(`VIM MODE: ${mode}`);
    }
  );

  context.subscriptions.push(showMode);
}

export function deactivate() {}
