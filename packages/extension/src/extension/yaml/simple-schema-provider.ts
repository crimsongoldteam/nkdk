import { getCanonicalUri, getJSONSchema } from "src/documentCache"
import { CustomSchemaProvider } from "./schema-extension-api"

export function createSimpleSchemaProvider(): CustomSchemaProvider {
  return {
    schema: "simple",
    requestSchema: (resource: string) => {
      return getCanonicalUri(resource)
    },
    requestSchemaContent: (uri: string) => {
      const schema = getJSONSchema(uri)
      return Promise.resolve(schema)
    },
  }
}
