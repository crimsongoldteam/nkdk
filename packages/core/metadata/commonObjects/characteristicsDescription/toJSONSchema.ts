import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../ruleRuntime"
import { CharacteristicsDescriptionsJSONSchema } from "./types"

export const exportCharacteristicsDescriptionsToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return CharacteristicsDescriptionsJSONSchema
}

registerTypeRule("CharacteristicsDescriptions", "exportToJSONSchema", exportCharacteristicsDescriptionsToJSONSchema)
