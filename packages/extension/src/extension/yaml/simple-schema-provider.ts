import { CustomSchemaProvider } from "./schema-extension-api"

const SIMPLE_SCHEMA_URI = "simple://example/simple.json"

const SIMPLE_SCHEMA_JSON = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Имя"
    },
    "count": {
      "type": "number",
      "description": "Число"
    }
  },
  "additionalProperties": false
}`

export function createSimpleSchemaProvider(): CustomSchemaProvider {
  return {
    schema: "simple",
    requestSchema: (resource: string) => {
      return SIMPLE_SCHEMA_URI
    },
    requestSchemaContent: (uri: string) => {
      return Promise.resolve(SIMPLE_SCHEMA_JSON)
    },
  }
}
