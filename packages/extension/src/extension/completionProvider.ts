import * as vscode from "vscode"
import { getCatalogPropertyReferenceScope, validateReferenceScope } from "@nakidka/core"
import { getWorkspaceGraph, onGraphUpdated } from "../workspaceGraph.js"

// Captures the type prefix before a dot, supporting Cyrillic
// e.g., "Справочник." or "Справочник.К" → captures "Справочник"
const TYPE_PREFIX_PATTERN = /([а-яёА-ЯЁa-zA-Z_][\wа-яёА-ЯЁ]*)\.[а-яёА-ЯЁ\w]*$/

// Captures the YAML key at the start of a value line, e.g., "  ОсновнаяФормаДляВыбора: ..."
const YAML_KEY_PATTERN = /^\s*([а-яёА-ЯЁa-zA-Z_][\wа-яёА-ЯЁ]*):\s+/

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

export function initCompletionProvider(context: vscode.ExtensionContext): void {
  const provider = new MetadataCompletionProvider()

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider({ language: "yaml" }, provider, "."),
    onGraphUpdated(() => provider.invalidateCache()),
  )
}

class MetadataCompletionProvider implements vscode.CompletionItemProvider {
  private _cache = new Map<string, vscode.CompletionItem[]>()

  invalidateCache(): void {
    this._cache.clear()
  }

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.CompletionItem[] | null {
    const lineText = document.lineAt(position.line).text
    const textBeforeCursor = lineText.substring(0, position.character)

    const match = TYPE_PREFIX_PATTERN.exec(textBeforeCursor)
    if (!match) return null

    const prefix = match[1]
    const nodePrefix = prefix + "."

    // Determine if this property has a referenceScope filter
    const keyMatch = YAML_KEY_PATTERN.exec(lineText)
    const yamlKey = keyMatch?.[1]
    const scope = yamlKey ? getCatalogPropertyReferenceScope(yamlKey) : undefined
    const ownerNodeId = scope != null ? getOwnerNodeIdFromFilePath(document.uri.fsPath) : undefined

    // Use cache only when no scope filter applies
    if (scope == null && this._cache.has(prefix)) {
      return this._cache.get(prefix)!
    }

    const graph = getWorkspaceGraph()
    const items: vscode.CompletionItem[] = []

    for (const nodeId of graph.nodes()) {
      if (!nodeId.startsWith(nodePrefix)) continue

      // Only top-level nodes (exactly one segment after prefix)
      const rest = nodeId.slice(nodePrefix.length)
      if (rest.includes(".")) continue

      // Apply referenceScope filter when applicable
      if (scope != null && ownerNodeId != null) {
        if (!validateReferenceScope(nodeId, scope, graph, ownerNodeId)) continue
      }

      const attrs = graph.getNodeAttributes(nodeId)
      const item = new vscode.CompletionItem(rest, vscode.CompletionItemKind.Reference)
      item.detail = nodeId
      if (!attrs.item) {
        item.tags = [vscode.CompletionItemTag.Deprecated]
        item.detail = `${nodeId} (заглушка)`
      }

      items.push(item)
    }

    if (scope == null) {
      this._cache.set(prefix, items)
    }

    return items
  }
}
