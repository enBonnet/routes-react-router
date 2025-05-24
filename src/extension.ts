import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.languages.registerCodeLensProvider(
			{ language: "typescript", scheme: "file", pattern: "**/routes.ts" },
			new RouteCodeLensProvider()
		)
	);
}

class RouteCodeLensProvider implements vscode.CodeLensProvider {
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
				const fullPath = "/" + [...stack, routeMatch[1]].join("/");
				lenses.push(
					new vscode.CodeLens(new vscode.Range(i, 0, i, 0), {
						title: `→ ${fullPath}`,
						command: "",
						tooltip: "Resolved path for route(...)"
					})
				);
			} else if (indexMatch) {
				const fullPath = "/" + stack.join("/");
				lenses.push(
					new vscode.CodeLens(new vscode.Range(i, 0, i, 0), {
						title: `→ ${fullPath}`,
						command: "",
						tooltip: "Resolved path for index(...)"
					})
				);
			} else if (prefixEndMatch) {
				stack.pop();
			}
		}

		return lenses;
	}
}
