import * as vscode from "vscode"
import {
  getCatalogPropertyReferenceScope,
  getDocumentPropertyReferenceScope,
  validateReferenceScope,
  walk,
} from "@nakidka/core"
import { getWorkspaceGraph, onGraphUpdated } from "../workspaceGraph.js"

// Captures the COMPLETE dotted path before the trigger dot (and optional partial text after it)
// "Справочник."              → "Справочник"
// "Справочник.Контрагенты." → "Справочник.Контрагенты"
// "МойРеквизит.Поле.Ча"    → "МойРеквизит.Поле"
const PATH_BEFORE_DOT =
  /(([а-яёА-ЯЁa-zA-Z_][\wа-яёА-ЯЁ]*)(\.[а-яёА-ЯЁa-zA-Z_][\wа-яёА-ЯЁ]*)*)\.[а-яёА-ЯЁ\w]*$/

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

    const match = PATH_BEFORE_DOT.exec(textBeforeCursor)
    if (!match) return null

    const fullPath = match[1] // Complete path before the trigger dot
    const nodePrefix = fullPath + "."
    const isCompound = fullPath.includes(".")

    // referenceScope only applies to single-segment type-prefix completion
    const keyMatch = YAML_KEY_PATTERN.exec(lineText)
    const yamlKey = keyMatch?.[1]
    const ownerNodeId = getOwnerNodeIdFromFilePath(document.uri.fsPath)
    const itemTypePrefix = ownerNodeId?.split(".")[0]

    const scope =
      !isCompound && yamlKey
        ? itemTypePrefix === "Справочник"
          ? getCatalogPropertyReferenceScope(yamlKey)
          : itemTypePrefix === "Документ"
            ? getDocumentPropertyReferenceScope(yamlKey)
            : undefined
        : undefined

    // Use cache when no scope filter applies
    if (scope == null && this._cache.has(fullPath)) {
      return this._cache.get(fullPath)!
    }

    const graph = getWorkspaceGraph()

    // Primary: collect direct children found in the graph as nodeId prefix matches
    const items: vscode.CompletionItem[] = []
    for (const nodeId of graph.nodes()) {
      if (!nodeId.startsWith(nodePrefix)) continue
      const rest = nodeId.slice(nodePrefix.length)
      if (rest.includes(".")) continue // Only direct children

      if (scope != null && ownerNodeId != null) {
        if (!validateReferenceScope(nodeId, scope, graph, ownerNodeId)) continue
      }

      const attrs = graph.getNodeAttributes(nodeId)
      const kind = isCompound ? vscode.CompletionItemKind.Field : vscode.CompletionItemKind.Reference
      const item = new vscode.CompletionItem(rest, kind)
      item.detail = nodeId
      if (!attrs.item) {
        item.tags = [vscode.CompletionItemTag.Deprecated]
        item.detail = `${nodeId} (заглушка)`
      }
      items.push(item)
    }

    if (items.length > 0) {
      if (scope == null) this._cache.set(fullPath, items)
      return items
    }

    // Fallback: dataPath completion via GraphWalker (relative paths like "МойРеквизит.")
    if (!ownerNodeId) return null

    const walkResult = walk(graph, [ownerNodeId], fullPath)
    if (walkResult.nodes.length === 0) return null

    // Union-семантика: собираем composition-детей всех разрешённых узлов
    const seen = new Set<string>()
    const dataPathItems: vscode.CompletionItem[] = []
    for (const nodeId of walkResult.nodes) {
      if (!graph.hasNode(nodeId)) continue
      for (const edgeId of graph.outEdges(nodeId)) {
        if (graph.getEdgeAttribute(edgeId, "kind") !== "composition") continue
        const target = graph.target(edgeId)
        const childName = graph.getNodeAttribute(target, "name")
        if (!childName || seen.has(childName)) continue
        seen.add(childName)

        const item = new vscode.CompletionItem(childName, vscode.CompletionItemKind.Field)
        item.detail = target
        if (!graph.getNodeAttribute(target, "item")) {
          item.tags = [vscode.CompletionItemTag.Deprecated]
          item.detail = `${target} (заглушка)`
        }
        dataPathItems.push(item)
      }
    }

    return dataPathItems.length > 0 ? dataPathItems : null
  }
}
