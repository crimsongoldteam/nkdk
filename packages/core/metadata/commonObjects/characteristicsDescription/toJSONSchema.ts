import { TSchema } from "@sinclairtypebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import { CharacteristicsDescriptionsJSONSchema } from "./types"

export const exportCharacteristicsDescriptionsToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return CharacteristicsDescriptionsJSONSchema
}

registerTypeRule("CharacteristicsDescriptions", "exportToJSONSchema", exportCharacteristicsDescriptionsToJSONSchema)
