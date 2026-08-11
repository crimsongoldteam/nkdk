import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import { CharacteristicsDescriptionsJSONSchema } from "./types"

export const exportCharacteristicsDescriptionsToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return CharacteristicsDescriptionsJSONSchema
}

export const metadataPropertyRule000 = definePropertyTypeRule("CharacteristicsDescriptions", "exportToJSONSchema", exportCharacteristicsDescriptionsToJSONSchema)
