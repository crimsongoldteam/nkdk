import { syncConfigurationFromXML } from "@nakidka/core"
import * as path from "node:path"
import * as vscode from "vscode"
import type { BaseLanguageClient } from "vscode-languageclient"
import type { LanguageClientOptions, ServerOptions } from "vscode-languageclient/node.js"
import { LanguageClient, TransportKind } from "vscode-languageclient/node.js"
import { registerDocumentChangeHandler } from "./documentChangeHandler.js"
import type { SseServerHandle } from "./sseServer.js"
import { startSseServer } from "./sseServer.js"
import { activateYAML } from "./yaml/node/yamlClientMain.js"

const languageClients: BaseLanguageClient[] = []
let sseServer: SseServerHandle | undefined

// This function is called when the extension is activated.
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const nkdkClient = await startNKDKLanguageClient(context)
  languageClients.push(nkdkClient)

  const yamlClient = await activateYAML(context)
  languageClients.push(yamlClient)

  const formPreviewDir = context.asAbsolutePath("formPreview")
  sseServer = startSseServer(formPreviewDir)

  context.subscriptions.push(registerDocumentChangeHandler(sseServer))
  context.subscriptions.push(
    vscode.commands.registerCommand("nkdk.importConfigurationFromXml", () => runimportConfigurationFromXml())
  )
}

// This function is called when the extension is deactivated.
export async function deactivate(): Promise<void> {
  if (sseServer) {
    await sseServer.stop()
    sseServer = undefined
  }
  await Promise.all(languageClients.map((client) => client.stop()))
  languageClients.length = 0
}

async function startNKDKLanguageClient(context: vscode.ExtensionContext): Promise<LanguageClient> {
  const serverModule = context.asAbsolutePath(path.join("out", "extension", "language.cjs"))
  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging.
  // By setting `process.env.DEBUG_BREAK` to a truthy value, the language server will wait until a debugger is attached.
  const debugOptions = {
    execArgv: ["--nolazy", `--inspect${process.env.DEBUG_BREAK ? "-brk" : ""}=${process.env.DEBUG_SOCKET || "6009"}`],
  }

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions },
  }

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "*", language: "nkdk" }],
  }

  // Create the language client and start the client.
  const client = new LanguageClient("nkdk", "nkdk", serverOptions, clientOptions)

  // Start the client. This will also launch the server
  await client.start()
  return client
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
  const context = { defaultLanguage: "ru", version: "2.20", exportToYAML: { toTyped: false } }
  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Импорт конфигурации...",
      },
      () => syncConfigurationFromXML({ context, inputDir, outputDir })
    )
    await vscode.window.showInformationMessage("Конфигурация импортирована.")
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await vscode.window.showErrorMessage(`Ошибка импорта конфигурации: ${message}`)
  }
}
