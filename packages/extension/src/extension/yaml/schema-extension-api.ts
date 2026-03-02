// import { Uri, workspace } from "vscode"
// import { BaseLanguageClient, RequestType } from "vscode-languageclient"
// import { logToExtensionOutputChannel } from "./extension"

// interface SchemaContributorProvider {
//   readonly requestSchema: (resource: string) => string
//   readonly requestSchemaContent: (uri: string) => Promise<string> | string
//   readonly label?: string
// }

// export enum MODIFICATION_ACTIONS {
//   "delete",
//   "add",
// }

// export interface SchemaAdditions {
//   schema: string
//   action: MODIFICATION_ACTIONS.add
//   path: string
//   key: string
//   content: unknown
// }

// export interface SchemaDeletions {
//   schema: string
//   action: MODIFICATION_ACTIONS.delete
//   path: string
//   key: string
// }

// // eslint-disable-next-line @typescript-eslint/no-namespace
// namespace SchemaModificationNotification {
//   // eslint-disable-next-line @typescript-eslint/ban-types
//   export const type: RequestType<SchemaAdditions | SchemaDeletions, void, {}> = new RequestType("json/schema/modify")
// }

// export interface CustomSchemaProvider {
//   schema: string
//   requestSchema: (resource: string) => string
//   requestSchemaContent: (uri: string) => Promise<string> | string
//   label?: string
// }

// export interface ExtensionAPI {
//   registerContributor(
//     schema: string,
//     requestSchema: (resource: string) => string,
//     requestSchemaContent: (uri: string) => Promise<string> | string,
//     label?: string
//   ): boolean
//   registerCustomSchemaProvider(schemaProvider: CustomSchemaProvider): boolean
//   modifySchemaContent(schemaModifications: SchemaAdditions | SchemaDeletions): Promise<void>
// }

// class SchemaExtensionAPI implements ExtensionAPI {
//   private _customSchemaContributors: { [index: string]: SchemaContributorProvider } = {}
//   private _yamlClient: BaseLanguageClient

//   constructor(client: BaseLanguageClient) {
//     this._yamlClient = client
//   }

//   /**
//    * Register a custom schema provider
//    *
//    * @param {string} the provider's name
//    * @param requestSchema the requestSchema function
//    * @param requestSchemaContent the requestSchemaContent function
//    * @param label the content label, yaml key value pair, like 'apiVersion:some.api/v1'
//    * @returns {boolean}
//    */
//   public registerContributor(
//     schema: string,
//     requestSchema: (resource: string) => string,
//     requestSchemaContent: (uri: string) => Promise<string> | string,
//     label?: string
//   ): boolean {
//     if (this._customSchemaContributors[schema]) {
//       return false
//     }

//     if (!requestSchema) {
//       throw new Error("Illegal parameter for requestSchema.")
//     }

//     if (label) {
//       const [first, second] = label.split(":")
//       if (first && second) {
//         label = second.trim()
//         label = label.split(".").join("\\.")
//         label = `${first}:[\t ]+${label}`
//       }
//     }
//     this._customSchemaContributors[schema] = <SchemaContributorProvider>{
//       requestSchema,
//       requestSchemaContent,
//       label,
//     }

//     return true
//   }

//   /**
//    * Register a custom schema provider (convenience wrapper around registerContributor).
//    */
//   public registerCustomSchemaProvider(schemaProvider: CustomSchemaProvider): boolean {
//     return this.registerContributor(
//       schemaProvider.schema,
//       schemaProvider.requestSchema,
//       schemaProvider.requestSchemaContent,
//       schemaProvider.label
//     )
//   }

//   /** URI схемы по умолчанию для любого YAML (подставляется в matches в requestCustomSchema). */
//   static readonly DEFAULT_SCHEMA_URI = "simple://example/simple.json"

//   /**
//    * Call requestSchema for each provider and finds all matches.
//    *
//    * @param {string} resource
//    * @returns {string} the schema uri
//    */
//   public requestCustomSchema(resource: string): string[] {
//     const matches: string[] = []
//     for (const customKey of Object.keys(this._customSchemaContributors)) {
//       try {
//         const contributor = this._customSchemaContributors[customKey]
//         let uri: string
//         if (contributor.label && workspace.textDocuments) {
//           const labelRegexp = new RegExp(contributor.label, "g")
//           for (const doc of workspace.textDocuments) {
//             if (doc.uri.toString() === resource) {
//               if (labelRegexp.test(doc.getText())) {
//                 uri = contributor.requestSchema(resource)
//                 return [uri]
//               }
//             }
//           }
//         }

//         uri = contributor.requestSchema(resource)

//         if (uri) {
//           matches.push(uri)
//         }
//       } catch (error) {
//         logToExtensionOutputChannel(
//           `Error thrown while requesting schema "${error}" when calling the registered contributor "${customKey}"`
//         )
//       }
//     }
//     // // Всегда добавляем схему по умолчанию для любого YAML, если её ещё нет в списке
//     // if (matches.indexOf(SchemaExtensionAPI.DEFAULT_SCHEMA_URI) === -1) {
//     //   matches.push(SchemaExtensionAPI.DEFAULT_SCHEMA_URI)
//     // }
//     return matches
//   }

//   /**
//    * Call requestCustomSchemaContent for named provider and get the schema content.
//    *
//    * @param {string} uri the schema uri returned from requestSchema.
//    * @returns {string} the schema content
//    */
//   public requestCustomSchemaContent(uri: string): Promise<string> | string {
//     if (uri) {
//       const _uri = Uri.parse(uri)

//       if (
//         _uri.scheme &&
//         this._customSchemaContributors[_uri.scheme] &&
//         this._customSchemaContributors[_uri.scheme].requestSchemaContent
//       ) {
//         return this._customSchemaContributors[_uri.scheme].requestSchemaContent(uri)
//       }
//     }
//   }

//   public async modifySchemaContent(schemaModifications: SchemaAdditions | SchemaDeletions): Promise<void> {
//     return this._yamlClient.sendRequest(SchemaModificationNotification.type, schemaModifications)
//   }

//   public hasProvider(schema: string): boolean {
//     return this._customSchemaContributors[schema] !== undefined
//   }
// }

// // constants
// export const CUSTOM_SCHEMA_REQUEST = "custom/schema/request"
// export const CUSTOM_CONTENT_REQUEST = "custom/schema/content"

// export { SchemaExtensionAPI }
