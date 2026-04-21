import * as fs from "fs"
import * as path from "path"
import * as vscode from "vscode"
import { isMap } from "yaml"
import {
  importMetadataCatalogFromYAML,
  importMetadataDocumentFromYAML,
  importMetadataEnumerationFromYAML,
  MetadataGraph,
  parseMetadataYaml,
} from "@nakidka/core"

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
  const parsed = parseMetadataYaml(text)
  importMetadataCatalogFromYAML(
    {
      version: "2.20",
      defaultLanguage: "ru",
      graph,
      graphContext: {
        filePath: yamlPath,
        currentYamlMap: isMap(parsed.doc.contents) ? parsed.doc.contents : undefined,
      },
    },
    parsed.data,
    catalogName,
  )
}

function importEnumerationFile(graph: MetadataGraph, yamlPath: string, text: string, enumName: string): void {
  const parsed = parseMetadataYaml(text)
  importMetadataEnumerationFromYAML(
    {
      version: "2.20",
      defaultLanguage: "ru",
      graph,
      graphContext: {
        filePath: yamlPath,
        currentYamlMap: isMap(parsed.doc.contents) ? parsed.doc.contents : undefined,
      },
    },
    parsed.data,
    enumName,
  )
}

function importDocumentFile(graph: MetadataGraph, yamlPath: string, text: string, documentName: string): void {
  const parsed = parseMetadataYaml(text)
  importMetadataDocumentFromYAML(
    {
      version: "2.20",
      defaultLanguage: "ru",
      graph,
      graphContext: {
        filePath: yamlPath,
        currentYamlMap: isMap(parsed.doc.contents) ? parsed.doc.contents : undefined,
      },
    },
    parsed.data,
    documentName,
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

  const documentsPath = path.join(workspaceFolder.uri.fsPath, "Документ")
  if (fs.existsSync(documentsPath)) {
    const entries = fs.readdirSync(documentsPath, { withFileTypes: true })
    for (const dir of entries.filter((e) => e.isDirectory())) {
      const yamlPath = path.join(documentsPath, dir.name, "Свойства.yml")
      if (!fs.existsSync(yamlPath)) continue

      try {
        const text = fs.readFileSync(yamlPath, "utf-8")
        importDocumentFile(newGraph, yamlPath, text, dir.name)
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
        importEnumerationFile(newGraph, yamlPath, text, dir.name)
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

        if (objectType === "Документ") {
          importDocumentFile(_graph, filePath, text, objectName)
        } else if (objectType === "Перечисление") {
          importEnumerationFile(_graph, filePath, text, objectName)
        } else {
          importCatalogFile(_graph, filePath, text, objectName)
        }
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
