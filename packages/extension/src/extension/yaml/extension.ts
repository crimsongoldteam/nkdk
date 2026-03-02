/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Copyright (c) Adam Voss. All rights reserved.
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
"use strict"

import { getJSONSchema, getJSONSchemaUri } from "src/documentCache"
import { ExtensionContext, workspace } from "vscode"
import {
  BaseLanguageClient,
  LanguageClientOptions,
  NotificationType,
  RequestType,
  RevealOutputChannelOn,
} from "vscode-languageclient"

export const CUSTOM_SCHEMA_REQUEST = "custom/schema/request"
export const CUSTOM_CONTENT_REQUEST = "custom/schema/content"

export interface ISchemaAssociations {
  [pattern: string]: string[]
}

export interface ISchemaAssociation {
  fileMatch: string[]
  uri: string
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace SettingIds {
  export const maxItemsComputed = "yaml.maxItemsComputed"
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace StorageIds {
  export const maxItemsExceededInformation = "yaml.maxItemsExceededInformation"
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace SchemaAssociationNotification {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const type: NotificationType<ISchemaAssociations | ISchemaAssociation[]> = new NotificationType(
    "json/schemaAssociations"
  )
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace VSCodeContentRequestRegistration {
  // eslint-disable-next-line @typescript-eslint/ban-types
  export const type: NotificationType<{}> = new NotificationType("yaml/registerContentRequest")
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace VSCodeContentRequest {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const type: RequestType<string, string, any> = new RequestType("vscode/content")
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace FSReadFile {
  // eslint-disable-next-line @typescript-eslint/ban-types
  export const type: RequestType<string, string, {}> = new RequestType("fs/readFile")
}

export const FSReadUriType: RequestType<string, string, unknown> = new RequestType("fs/readUri")

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace DynamicCustomSchemaRequestRegistration {
  // eslint-disable-next-line @typescript-eslint/ban-types
  export const type: NotificationType<{}> = new NotificationType("yaml/registerCustomSchemaRequest")
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace SchemaSelectionRequests {
  export const type: NotificationType<void> = new NotificationType("yaml/supportSchemaSelection")
  export const schemaStoreInitialized: NotificationType<void> = new NotificationType("yaml/schema/store/initialized")
}

let client: BaseLanguageClient

const lsName = "YAML Support"

export type LanguageClientConstructor = (
  name: string,
  description: string,
  clientOptions: LanguageClientOptions
) => BaseLanguageClient

export function startClient(context: ExtensionContext, newLanguageClient: LanguageClientConstructor): void {
  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ language: "yaml" }],
    synchronize: {
      fileEvents: [workspace.createFileSystemWatcher("**/*.yaml ")],
    },
    revealOutputChannelOn: RevealOutputChannelOn.Never,
  }

  client = newLanguageClient("yaml", lsName, clientOptions)

  context.subscriptions.push({
    dispose: () => {
      void client.dispose()
    },
  })

  void client.start().then(() => {
    client.sendNotification(DynamicCustomSchemaRequestRegistration.type)
    client.onRequest(CUSTOM_SCHEMA_REQUEST, (resource: string) => {
      return [getJSONSchemaUri(resource)]
    })
    client.onRequest(CUSTOM_CONTENT_REQUEST, (uri: string) => {
      return getJSONSchema(uri)
    })
    client.onRequest(VSCodeContentRequest.type, (uri: string) => {
      return getJSONSchema(uri)
    })
  })
}
