/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ExtensionContext } from "vscode"
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from "vscode-languageclient/node"
import { LanguageClientConstructor, startClient } from "../extension"

// import { SchemaExtensionAPI } from "../schema-extension-api"

// import { getRedHatService } from '@redhat-developer/vscode-redhat-telemetry';
// import { JSONSchemaCache } from "../json-schema-cache"

// this method is called when vs code is activated
export async function activateYAML(context: ExtensionContext): Promise<void> {
  // Create Telemetry Service
  // const telemetry = await (await getRedHatService(context)).getTelemetryService()

  const serverModule = context.asAbsolutePath("./node_modules/yaml-language-server/out/server/src/server.js")
  // }

  // The debug options for the server
  const debugOptions = { execArgv: ["--nolazy", "--inspect=6012"] }

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
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

  await startClient(context, newLanguageClient)
  return undefined
}

function startedFromSources(): boolean {
  return process.env["DEBUG_VSCODE_YAML"] === "true"
}
