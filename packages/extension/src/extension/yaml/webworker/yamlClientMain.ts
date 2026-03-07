/* eslint-disable @typescript-eslint/explicit-function-return-type */
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// import { getRedHatService } from "@redhat-developer/vscode-redhat-telemetry/lib/webworker"
import { ExtensionContext, l10n } from "vscode"
import { LanguageClientOptions } from "vscode-languageclient"
import { LanguageClient } from "vscode-languageclient/browser"
import { LanguageClientConstructor, startClient } from "../extension"
// this method is called when vs code is activated
export async function activate(context: ExtensionContext): Promise<void> {
  const extensionUri = context.extensionUri
  const serverMain = extensionUri.with({
    path: extensionUri.path + "./node_modules/yaml-language-server/out/languageserver-web.js",
  })
  // try {
  const worker = new Worker(serverMain.toString())
  worker.postMessage({ l10nBundle: l10n.bundle })
  const newLanguageClient: LanguageClientConstructor = (
    id: string,
    name: string,
    clientOptions: LanguageClientOptions
  ) => {
    return new LanguageClient(id, name, clientOptions, worker)
  }

  startClient(context, newLanguageClient)
}
