import { syncConfigurationFromXML, syncConfigurationToXML, type ConfigurationSyncResult } from "@nakidka/core"
import * as vscode from "vscode"
import type { BaseLanguageClient } from "vscode-languageclient"
import { registerDocumentChangeHandler } from "./documentChangeHandler.js"
import type { SseServerHandle } from "./sseServer.js"
import { startSseServer } from "./sseServer.js"
import { activateYAML } from "./yaml/node/yamlClientMain.js"

const languageClients: BaseLanguageClient[] = []
let sseServer: SseServerHandle | undefined
let nkdkOutputChannel: vscode.OutputChannel | undefined

function getNkdkOutputChannel(): vscode.OutputChannel {
  if (!nkdkOutputChannel) {
    nkdkOutputChannel = vscode.window.createOutputChannel("NKDK")
  }
  return nkdkOutputChannel
}

// This function is called when the extension is activated.
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const yamlClient = await activateYAML(context)
  languageClients.push(yamlClient)

  const formPreviewDir = context.asAbsolutePath("formPreview")
  sseServer = startSseServer(formPreviewDir)

  context.subscriptions.push(registerDocumentChangeHandler(sseServer))
  context.subscriptions.push(
    vscode.commands.registerCommand("nkdk.importConfigurationFromXml", () => runimportConfigurationFromXml())
  )
  context.subscriptions.push(
    vscode.commands.registerCommand("nkdk.syncConfigurationToXml", () => runSyncConfigurationToXml())
  )
}

// This function is called when the extension is deactivated.
export async function deactivate(): Promise<void> {
  if (sseServer) {
    await sseServer.stop()
    sseServer = undefined
  }
  nkdkOutputChannel?.dispose()
  nkdkOutputChannel = undefined
  await Promise.all(languageClients.map((client) => client.stop()))
  languageClients.length = 0
}

async function runimportConfigurationFromXml(): Promise<void> {
  const selected = await vscode.window.showOpenDialog({
    canSelectFolders: true,
    canSelectMany: false,
    title: "Выберите каталог с конфигурацией (должна быть подпапка Catalogs)",
  })
  if (!selected?.length) {
    return
  }
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
  if (!workspaceFolder) {
    await vscode.window.showErrorMessage("Откройте папку проекта (workspace) для импорта конфигурации.")
    return
  }
  const inputDir = selected[0].fsPath
  const outputDir = workspaceFolder.uri.fsPath
  const context = {
    defaultLanguage: "ru",
    version: "2.20",
    exportToYAML: { toTyped: false },
    fromXML: { forReference: false },
  }
  try {
    let result: ConfigurationSyncResult | undefined
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Импорт конфигурации...",
      },
      async () => {
        result = await syncConfigurationFromXML({ context, inputDir, outputDir })
      },
    )
    if (result && result.failed.length > 0) {
      const outputChannel = getNkdkOutputChannel()
      outputChannel.clear()
      for (const f of result.failed) {
        const label = f.parent ? `${f.parent}/${f.name}` : f.name
        outputChannel.appendLine(`✖ ${f.kind} "${label}": ${f.error.message}`)
      }
      outputChannel.show()
      await vscode.window.showWarningMessage(
        `Импорт завершён: ${result.succeeded} успешно, ${result.failed.length} с ошибкой. Подробности в Output.`,
      )
    } else {
      await vscode.window.showInformationMessage("Конфигурация импортирована.")
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await vscode.window.showErrorMessage(`Ошибка импорта конфигурации: ${message}`)
  }
}

async function runSyncConfigurationToXml(): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
  if (!workspaceFolder) {
    await vscode.window.showErrorMessage("Откройте папку проекта (workspace) для синхронизации конфигурации с XML.")
    return
  }
  const selected = await vscode.window.showOpenDialog({
    canSelectFolders: true,
    canSelectMany: false,
    title: "Выберите каталог для выгрузки XML (будет создана/обновлена подпапка Catalogs)",
  })
  if (!selected?.length) {
    return
  }
  const inputDir = workspaceFolder.uri.fsPath
  const outputDir = selected[0].fsPath
  const context = {
    defaultLanguage: "ru",
    version: "2.20",
    exportToYAML: { toTyped: false },
    exportToXML: {
      itemsTree: [],
      configDumpInfo: new Map(),
      version: "2.20",
      context: {
        forms: [],
        templates: [],
        parentName: "",
        metadataForNumbering: [],
      },
    },
  }
  try {
    let result: ConfigurationSyncResult | undefined
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Синхронизация конфигурации в XML...",
      },
      async () => {
        result = await syncConfigurationToXML({ context, inputDir, outputDir })
      },
    )
    if (result && result.failed.length > 0) {
      const outputChannel = getNkdkOutputChannel()
      outputChannel.clear()
      for (const f of result.failed) {
        const label = f.parent ? `${f.parent}/${f.name}` : f.name
        outputChannel.appendLine(`✖ ${f.kind} "${label}": ${f.error.message}`)
      }
      outputChannel.show()
      await vscode.window.showWarningMessage(
        `Синхронизация завершена: ${result.succeeded} успешно, ${result.failed.length} с ошибкой. Подробности в Output.`,
      )
    } else {
      await vscode.window.showInformationMessage("Конфигурация синхронизирована с XML.")
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await vscode.window.showErrorMessage(`Ошибка синхронизации конфигурации с XML: ${message}`)
  }
}
