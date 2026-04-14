import * as fs from "fs"
import * as vscode from "vscode"
import { getWorkspaceGraph, onGraphUpdated } from "../workspaceGraph.js"

let _collection: vscode.DiagnosticCollection | undefined

export function initDiagnosticProvider(context: vscode.ExtensionContext): void {
  _collection = vscode.languages.createDiagnosticCollection("nakidka-links")
  context.subscriptions.push(
    _collection,
    onGraphUpdated(() => updateDiagnostics()),
  )
  updateDiagnostics()
}

function offsetToPosition(content: string, offset: number): vscode.Position {
  const before = content.substring(0, Math.min(offset, content.length))
  const lines = before.split("\n")
  return new vscode.Position(lines.length - 1, lines[lines.length - 1].length)
}

function updateDiagnostics(): void {
  if (!_collection) return

  const graph = getWorkspaceGraph()
  const brokenRefs = graph.getBrokenReferences()
  const brokenStubIds = new Set(brokenRefs.keys())

  // Group source nodes by file
  const fileIssues = new Map<string, Array<{ offset: number; length?: number; targetId: string }>>()

  for (const nodeId of graph.nodes()) {
    const attrs = graph.getNodeAttributes(nodeId)
    if (!attrs.filePath || !attrs.positionFrom) continue

    for (const edgeId of graph.outEdges(nodeId)) {
      if (graph.getEdgeAttribute(edgeId, "kind") !== "reference") continue
      const targetId = graph.target(edgeId)
      if (!brokenStubIds.has(targetId)) continue

      let list = fileIssues.get(attrs.filePath)
      if (!list) {
        list = []
        fileIssues.set(attrs.filePath, list)
      }
      list.push({
        offset: attrs.positionFrom.offset,
        length: attrs.positionFrom.length,
        targetId,
      })
    }
  }

  _collection.clear()

  for (const [filePath, issues] of fileIssues) {
    let content: string
    try {
      content = fs.readFileSync(filePath, "utf-8")
    } catch {
      continue
    }

    const uri = vscode.Uri.file(filePath)
    const diagnostics: vscode.Diagnostic[] = []

    for (const { offset: attrKeyOffset, targetId } of issues) {
      // Ищем точную позицию значения типа (Справочник.Категории) начиная от ключа реквизита
      const typePos = content.indexOf(targetId, attrKeyOffset)
      const offset = typePos !== -1 ? typePos : attrKeyOffset
      const length = typePos !== -1 ? targetId.length : undefined

      const start = offsetToPosition(content, offset)
      const end =
        length !== undefined
          ? offsetToPosition(content, offset + length)
          : new vscode.Position(start.line, start.character + targetId.length)
      const range = new vscode.Range(start, end)

      const diagnostic = new vscode.Diagnostic(
        range,
        `Битая ссылка: ${targetId}`,
        vscode.DiagnosticSeverity.Error,
      )
      diagnostic.source = "nakidka"
      diagnostics.push(diagnostic)
    }

    _collection.set(uri, diagnostics)
  }
}
