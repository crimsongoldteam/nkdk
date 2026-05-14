import * as vscode from "vscode"

import { YamlCypherCompletionProvider } from "./provider"

export function registerYamlCypherCompletionProvider(_context: vscode.ExtensionContext): vscode.Disposable {
  return vscode.languages.registerCompletionItemProvider(
    { language: "yaml", scheme: "*" },
    new YamlCypherCompletionProvider(),
  )
}
