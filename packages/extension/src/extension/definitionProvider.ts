import * as vscode from "vscode"
import { getWorkspaceGraph } from "../workspaceGraph.js"

// Captures dotted identifiers with Cyrillic and Latin letters
// e.g. Справочник.Контрагенты, Справочник.Товары.Цена
const DOTTED_ID_PATTERN = /[а-яёА-ЯЁa-zA-Z_][\wа-яёА-ЯЁ]*(?:\.[а-яёА-ЯЁa-zA-Z_][\wа-яёА-ЯЁ]*)*/

export function initDefinitionProvider(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider({ language: "yaml" }, new MetadataDefinitionProvider()),
  )
}

class MetadataDefinitionProvider implements vscode.DefinitionProvider {
  async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<vscode.Location | null> {
    const range = document.getWordRangeAtPosition(position, DOTTED_ID_PATTERN)
    if (!range) return null

    const word = document.getText(range)
    const graph = getWorkspaceGraph()

    if (!graph.hasNode(word)) return null

    const attrs = graph.getNodeAttributes(word)
    if (!attrs.filePath) return null

    const targetUri = vscode.Uri.file(attrs.filePath)

    if (attrs.positionFrom?.offset != null) {
      const targetDoc = await vscode.workspace.openTextDocument(targetUri)
      const pos = targetDoc.positionAt(attrs.positionFrom.offset)
      return new vscode.Location(targetUri, pos)
    }

    // Top-level object → start of file
    return new vscode.Location(targetUri, new vscode.Position(0, 0))
  }
}
