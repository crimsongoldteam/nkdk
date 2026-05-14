import * as vscode from "vscode"

import { resolveYamlCypherCompletionValues } from "./providerCore"

export class YamlCypherCompletionProvider implements vscode.CompletionItemProvider {
  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<vscode.CompletionItem[]> {
    const values = await resolveYamlCypherCompletionValues({
      filePath: document.uri.fsPath,
      text: document.getText(),
      line: position.line,
    })

    return values.map((value) => {
      const item = new vscode.CompletionItem(value.label, vscode.CompletionItemKind.Value)
      item.insertText = value.value
      item.detail = value.detail
      return item
    })
  }
}
