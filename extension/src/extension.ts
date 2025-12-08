import * as vscode from "vscode"
import { importConfigFromXml } from "./commands/importConfigFromXml"

export const activate = (context: vscode.ExtensionContext) => {
  const disposable = vscode.commands.registerCommand(
    "nkdk.importConfigFromXml",
    async () => {
      await importConfigFromXml()
    }
  )

  context.subscriptions.push(disposable)
}
