import * as fs from "fs"
import * as path from "path"
import * as vscode from "vscode"
import { isMap, parse, parseDocument } from "yaml"
import { importMetadataCatalogFromYAML, MetadataGraph } from "@nakidka/core"

let _graph = new MetadataGraph()
const _graphUpdatedCallbacks: Array<() => void> = []

export function getWorkspaceGraph(): MetadataGraph {
  return _graph
}

/** Подписаться на обновления графа. Возвращает Disposable для отписки. */
export function onGraphUpdated(callback: () => void): vscode.Disposable {
  _graphUpdatedCallbacks.push(callback)
  return new vscode.Disposable(() => {
    const idx = _graphUpdatedCallbacks.indexOf(callback)
    if (idx !== -1) _graphUpdatedCallbacks.splice(idx, 1)
  })
}

function _notifyGraphUpdated(): void {
  for (const cb of _graphUpdatedCallbacks) cb()
}

function importCatalogFile(graph: MetadataGraph, yamlPath: string, text: string, catalogName: string): void {
  const root = parseDocument(text).contents
  importMetadataCatalogFromYAML(
    {
      version: "2.20",
      defaultLanguage: "ru",
      graph,
      graphContext: {
        filePath: yamlPath,
        currentYamlMap: isMap(root) ? root : undefined,
      },
    },
    parse(text),
    catalogName,
  )
}

async function loadWorkspace(workspaceFolder: vscode.WorkspaceFolder): Promise<void> {
  const newGraph = new MetadataGraph()

  const catalogsPath = path.join(workspaceFolder.uri.fsPath, "Справочник")
  if (fs.existsSync(catalogsPath)) {
    const entries = fs.readdirSync(catalogsPath, { withFileTypes: true })
    for (const dir of entries.filter((e) => e.isDirectory())) {
      const yamlPath = path.join(catalogsPath, dir.name, "Свойства.yml")
      if (!fs.existsSync(yamlPath)) continue

      try {
        const text = fs.readFileSync(yamlPath, "utf-8")
        importCatalogFile(newGraph, yamlPath, text, dir.name)
      } catch {
        // Пропускаем нечитаемые файлы
      }
    }
  }

  _graph = newGraph
  _notifyGraphUpdated()
}

export function initWorkspaceGraph(context: vscode.ExtensionContext): void {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
  if (workspaceFolder) {
    loadWorkspace(workspaceFolder).catch(() => {})
  }

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((doc) => {
      const filePath = doc.uri.fsPath
      if (!filePath.endsWith("Свойства.yml")) return

      _graph.invalidateFile(filePath)

      try {
        const text = doc.getText()
        const parts = filePath.split(path.sep)
        const catalogName = parts[parts.length - 2]
        importCatalogFile(_graph, filePath, text, catalogName)
      } catch {
        // Пропускаем при ошибке парсинга
      }

      _notifyGraphUpdated()
    }),
  )

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      const newFolder = vscode.workspace.workspaceFolders?.[0]
      if (newFolder) {
        loadWorkspace(newFolder).catch(() => {})
      } else {
        _graph = new MetadataGraph()
        _notifyGraphUpdated()
      }
    }),
  )
}
