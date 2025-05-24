import * as vscode from "vscode";

const COPY_ROUTE_COMMAND = "routeAnnotator.copyRoutePath";

vscode.commands.registerCommand(COPY_ROUTE_COMMAND, async (path: string) => {
	await vscode.env.clipboard.writeText(path);
	vscode.window.showInformationMessage(`Copied path: ${path}`);
});

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.languages.registerCodeLensProvider(
			{ language: "typescript", scheme: "file", pattern: "**/routes.ts" },
			new RouteCodeLensProvider(),
		),
	);
}

export class RouteCodeLensProvider implements vscode.CodeLensProvider {
	provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
		const lenses: vscode.CodeLens[] = [];

		const lines = document.getText().split("\n");

		const stack: string[] = [];

		const prefixStart = /^\s*\.\.\.\s*prefix\("([^"]+)",\s*\[/;
		const prefixEnd = /^\s*\]\),?/;

		const routeLine = /^\s*route\("([^"]+)",/;
		const indexLine = /^\s*index\(/;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];

			const prefixStartMatch = line.match(prefixStart);
			const routeMatch = line.match(routeLine);
			const indexMatch = line.match(indexLine);
			const prefixEndMatch = line.match(prefixEnd);

			if (prefixStartMatch) {
				stack.push(prefixStartMatch[1]);
			} else if (routeMatch) {
				const fullPath = `/${[...stack, routeMatch[1]].join("/")}`;
				lenses.push(
					new vscode.CodeLens(new vscode.Range(i, 0, i, 0), {
						title: `→ ${fullPath}`,
						command: COPY_ROUTE_COMMAND,
						arguments: [fullPath],
						tooltip: `Copy "${fullPath}" on click`,
					}),
				);
			} else if (indexMatch) {
				const fullPath = `/${stack.join("/")}`;
				lenses.push(
					new vscode.CodeLens(new vscode.Range(i, 0, i, 0), {
						title: `→ ${fullPath}`,
						command: COPY_ROUTE_COMMAND,
						arguments: [fullPath],
						tooltip: `Copy "${fullPath}" on click`,
					}),
				);
			} else if (prefixEndMatch) {
				stack.pop();
			}
		}

		return lenses;
	}
}
