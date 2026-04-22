import * as fs from "fs"
import * as path from "path"
import * as vscode from "vscode"
import { importMetadataFileWithGraph, MetadataGraph } from "@nakidka/core"

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

const _importContext = { version: "2.20", defaultLanguage: "ru" }

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
        importMetadataFileWithGraph({ filePath: yamlPath, text, kind: "catalog", name: dir.name, graph: newGraph, context: _importContext })
      } catch {
        // Пропускаем нечитаемые файлы
      }
    }
  }

  const documentsPath = path.join(workspaceFolder.uri.fsPath, "Документ")
  if (fs.existsSync(documentsPath)) {
    const entries = fs.readdirSync(documentsPath, { withFileTypes: true })
    for (const dir of entries.filter((e) => e.isDirectory())) {
      const yamlPath = path.join(documentsPath, dir.name, "Свойства.yml")
      if (!fs.existsSync(yamlPath)) continue

      try {
        const text = fs.readFileSync(yamlPath, "utf-8")
        importMetadataFileWithGraph({ filePath: yamlPath, text, kind: "document", name: dir.name, graph: newGraph, context: _importContext })
      } catch {
        // Пропускаем нечитаемые файлы
      }
    }
  }

  const enumerationsPath = path.join(workspaceFolder.uri.fsPath, "Перечисление")
  if (fs.existsSync(enumerationsPath)) {
    const entries = fs.readdirSync(enumerationsPath, { withFileTypes: true })
    for (const dir of entries.filter((e) => e.isDirectory())) {
      const yamlPath = path.join(enumerationsPath, dir.name, "Свойства.yml")
      if (!fs.existsSync(yamlPath)) continue

      try {
        const text = fs.readFileSync(yamlPath, "utf-8")
        importMetadataFileWithGraph({ filePath: yamlPath, text, kind: "enumeration", name: dir.name, graph: newGraph, context: _importContext })
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
        const objectName = parts[parts.length - 2]
        const objectType = parts[parts.length - 3]

        const kind = objectType === "Документ" ? "document" : objectType === "Перечисление" ? "enumeration" : "catalog"
        importMetadataFileWithGraph({ filePath, text, kind, name: objectName, graph: _graph, context: _importContext })
      } catch {
        // Пропускаем при ошибке парсинга
      }

      _notifyGraphUpdated()
    }),
  )

  context.subscriptions.push(
    vscode.workspace.onDidDeleteFiles((event) => {
      let changed = false
      for (const file of event.files) {
        if (file.fsPath.endsWith("Свойства.yml")) {
          _graph.invalidateFile(file.fsPath)
          changed = true
        }
      }
      if (changed) _notifyGraphUpdated()
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
