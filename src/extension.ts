import * as vscode from "vscode"
import { CatScratchEditorProvider } from "./catScratchEditor"

export function activate(context: vscode.ExtensionContext) {
  // Register our custom editor providers
  context.subscriptions.push(CatScratchEditorProvider.register(context))
}

export function deactivate() {
  // Clean up resources if needed
}
