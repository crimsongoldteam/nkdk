import { getJSONSchema } from "src/documentCache"
import { CustomSchemaProvider } from "yaml-language-server/out/server/src/languageservice/services/yamlSchemaService"

export const createSimpleSchemaProvider: CustomSchemaProvider = async (uri: string): Promise<string> => {
  return getJSONSchema(uri)
}
