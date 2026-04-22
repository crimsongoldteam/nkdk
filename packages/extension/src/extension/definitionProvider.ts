import * as vscode from "vscode"
import { MetadataGraph, walk } from "@nakidka/core"
import { getWorkspaceGraph } from "../workspaceGraph.js"

// Captures dotted identifiers with Cyrillic and Latin letters
// e.g. Справочник.Контрагенты, Справочник.Товары.Цена, МойРеквизит
const DOTTED_ID_PATTERN = /[а-яёА-ЯЁa-zA-Z_][\wа-яёА-ЯЁ]*(?:\.[а-яёА-ЯЁa-zA-Z_][\wа-яёА-ЯЁ]*)*/

/** Extracts ownerNodeId from a file path like .../Справочник/Контрагенты/Свойства.yml */
function getOwnerNodeIdFromFilePath(filePath: string): string | undefined {
  const parts = filePath.split(/[\\/]/)
  if (parts.length < 3) return undefined
  if (parts[parts.length - 1] !== "Свойства.yml") return undefined
  const objectName = parts[parts.length - 2]
  const objectType = parts[parts.length - 3]
  if (!objectName || !objectType) return undefined
  return `${objectType}.${objectName}`
}

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

    // Case 1: Direct nodeId (e.g., "Справочник.Контрагенты")
    if (graph.hasNode(word)) {
      return locationForNode(graph, word)
    }

    // Case 2: dataPath relative to file owner
    // e.g., "МойРеквизит" in Справочник/МойСправочник/Свойства.yml
    const ownerNodeId = getOwnerNodeIdFromFilePath(document.uri.fsPath)
    if (!ownerNodeId || !graph.hasNode(ownerNodeId)) return null

    const result = walk(graph, [ownerNodeId], word)
    if (result.nodes.length === 0) return null

    return locationForNode(graph, result.nodes[0])
  }
}

async function locationForNode(graph: MetadataGraph, nodeId: string): Promise<vscode.Location | null> {
  const attrs = graph.getNodeAttributes(nodeId)
  const filePath = attrs.filePaths?.[0]
  if (!filePath) return null

  const targetUri = vscode.Uri.file(filePath)

  if (attrs.positionFrom?.offset != null) {
    const targetDoc = await vscode.workspace.openTextDocument(targetUri)
    const pos = targetDoc.positionAt(attrs.positionFrom.offset)
    return new vscode.Location(targetUri, pos)
  }

  // Top-level object → start of file
  return new vscode.Location(targetUri, new vscode.Position(0, 0))
}
