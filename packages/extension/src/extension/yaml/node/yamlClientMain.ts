/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import path from "path"
import { ExtensionContext } from "vscode"
import type { BaseLanguageClient } from "vscode-languageclient"
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from "vscode-languageclient/node"
import { LanguageClientConstructor, startClient } from "../extension"

function startedFromSources(): boolean {
  return process.env["DEBUG_VSCODE_YAML"] === "true"
}

// this method is called when vs code is activated
export async function activateYAML(context: ExtensionContext): Promise<BaseLanguageClient> {
  let serverModule: string
  if (startedFromSources()) {
    serverModule = context.asAbsolutePath("./node_modules/yaml-language-server/out/server/src/server.js")
  } else {
    serverModule = context.asAbsolutePath(path.join("out", "extension", "yaml-language-server.cjs"))
  }

  const debugOptions = { execArgv: ["--nolazy", "--inspect=6012"] }

  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions },
  }

  const newLanguageClient: LanguageClientConstructor = (
    id: string,
    name: string,
    clientOptions: LanguageClientOptions
  ) => {
    return new LanguageClient(id, name, serverOptions, clientOptions)
  }

  return startClient(context, newLanguageClient)
}
