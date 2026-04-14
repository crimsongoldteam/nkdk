import * as vscode from "vscode"
import { getWorkspaceGraph, onGraphUpdated } from "../workspaceGraph.js"

// Паттерн: конец строки вида "Word." — захватываем prefix перед точкой
const TYPE_PREFIX_PATTERN = /(\w+)\.\w*$/

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

    const prefix = match[1] // например "Справочник"
    const nodePrefix = prefix + "."

    if (this._cache.has(prefix)) {
      return this._cache.get(prefix)!
    }

    const graph = getWorkspaceGraph()
    const items: vscode.CompletionItem[] = []

    for (const nodeId of graph.nodes()) {
      if (!nodeId.startsWith(nodePrefix)) continue

      // Только top-level узлы (ровно один сегмент после префикса)
      const rest = nodeId.slice(nodePrefix.length)
      if (rest.includes(".")) continue

      const attrs = graph.getNodeAttributes(nodeId)
      const item = new vscode.CompletionItem(rest, vscode.CompletionItemKind.Reference)
      item.detail = nodeId
      if (!attrs.item) {
        item.tags = [vscode.CompletionItemTag.Deprecated]
        item.detail = `${nodeId} (заглушка)`
      }

      items.push(item)
    }

    this._cache.set(prefix, items)
    return items
  }
}
