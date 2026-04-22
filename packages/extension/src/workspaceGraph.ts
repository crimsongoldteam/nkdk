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

/** Загружает все формы из директории `<ownerDir>/Формы/` в граф. */
function _loadFormsForOwner(ownerDir: string, ownerNodeId: string, graph: MetadataGraph): void {
  const formsPath = path.join(ownerDir, "Формы")
  if (!fs.existsSync(formsPath)) return

  const entries = fs.readdirSync(formsPath, { withFileTypes: true })
  for (const formDir of entries.filter((e) => e.isDirectory())) {
    const yamlPath = path.join(formsPath, formDir.name, "Форма.yaml")
    const nkdkPath = path.join(formsPath, formDir.name, "Форма.nkdk")
    if (!fs.existsSync(yamlPath)) continue

    try {
      const yaml = fs.readFileSync(yamlPath, "utf-8")
      const nkdkExists = fs.existsSync(nkdkPath)
      const nkdk = nkdkExists ? fs.readFileSync(nkdkPath, "utf-8") : undefined
      importMetadataFileWithGraph({
        filePath: yamlPath,
        nkdkFilePath: nkdkExists ? nkdkPath : undefined,
        sources: { yaml, nkdk },
        kind: "form",
        name: formDir.name,
        graph,
        context: _importContext,
        ownerNodeId,
      })
    } catch {
      // Пропускаем нечитаемые файлы
    }
  }
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
        importMetadataFileWithGraph({ filePath: yamlPath, sources: { yaml: text }, kind: "catalog", name: dir.name, graph: newGraph, context: _importContext })
      } catch {
        // Пропускаем нечитаемые файлы
      }

      _loadFormsForOwner(path.join(catalogsPath, dir.name), `Справочник.${dir.name}`, newGraph)
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
        importMetadataFileWithGraph({ filePath: yamlPath, sources: { yaml: text }, kind: "document", name: dir.name, graph: newGraph, context: _importContext })
      } catch {
        // Пропускаем нечитаемые файлы
      }

      _loadFormsForOwner(path.join(documentsPath, dir.name), `Документ.${dir.name}`, newGraph)
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
        importMetadataFileWithGraph({ filePath: yamlPath, sources: { yaml: text }, kind: "enumeration", name: dir.name, graph: newGraph, context: _importContext })
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

      if (filePath.endsWith("Свойства.yml")) {
        _graph.invalidateFile(filePath)

        try {
          const text = doc.getText()
          const parts = filePath.split(path.sep)
          const objectName = parts[parts.length - 2]
          const objectType = parts[parts.length - 3]

          const kind = objectType === "Документ" ? "document" : objectType === "Перечисление" ? "enumeration" : "catalog"
          importMetadataFileWithGraph({ filePath, sources: { yaml: text }, kind, name: objectName, graph: _graph, context: _importContext })
        } catch {
          // Пропускаем при ошибке парсинга
        }

        _notifyGraphUpdated()
        return
      }

      // Обработка файлов формы: Форма.yaml / Форма.nkdk
      const fileName = path.basename(filePath)
      if (fileName === "Форма.yaml" || fileName === "Форма.nkdk") {
        // Структура пути: .../OwnerTypeDir/OwnerName/Формы/FormName/Форма.{yaml,nkdk}
        const parts = filePath.split(path.sep)
        if (parts.length < 5) return
        const formName = parts[parts.length - 2]
        const formsDir = parts[parts.length - 3]
        const ownerName = parts[parts.length - 4]
        const ownerTypeDir = parts[parts.length - 5]

        if (formsDir !== "Формы") return

        const ownerNodeId = `${ownerTypeDir}.${ownerName}`
        const formDirPath = path.dirname(filePath)
        const yamlPath = path.join(formDirPath, "Форма.yaml")
        const nkdkPath = path.join(formDirPath, "Форма.nkdk")

        // Co-invalidation: достаточно инвалидировать один из двух файлов формы
        _graph.invalidateFile(filePath)

        if (!fs.existsSync(yamlPath)) {
          _notifyGraphUpdated()
          return
        }

        try {
          let yamlText: string
          let nkdkText: string | undefined
          const nkdkExists = fs.existsSync(nkdkPath)

          if (fileName === "Форма.yaml") {
            yamlText = doc.getText()
            nkdkText = nkdkExists ? fs.readFileSync(nkdkPath, "utf-8") : undefined
          } else {
            yamlText = fs.readFileSync(yamlPath, "utf-8")
            nkdkText = doc.getText()
          }

          importMetadataFileWithGraph({
            filePath: yamlPath,
            nkdkFilePath: nkdkExists ? nkdkPath : undefined,
            sources: { yaml: yamlText, nkdk: nkdkText },
            kind: "form",
            name: formName,
            graph: _graph,
            context: _importContext,
            ownerNodeId,
          })
        } catch {
          // Пропускаем при ошибке парсинга
        }

        _notifyGraphUpdated()
      }
    }),
  )

  context.subscriptions.push(
    vscode.workspace.onDidDeleteFiles((event) => {
      let changed = false
      for (const file of event.files) {
        const filePath = file.fsPath
        if (filePath.endsWith("Свойства.yml")) {
          _graph.invalidateFile(filePath)
          changed = true
        } else {
          const fileName = path.basename(filePath)
          if (fileName === "Форма.yaml" || fileName === "Форма.nkdk") {
            _graph.invalidateFile(filePath)
            changed = true
          }
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
