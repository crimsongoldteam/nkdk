import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { CharacteristicsDescriptionsJSONSchema } from "./types"

export const exportCharacteristicsDescriptionsToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return CharacteristicsDescriptionsJSONSchema
}

registerTypeRule("CharacteristicsDescriptions", "exportToJSONSchema", exportCharacteristicsDescriptionsToJSONSchema)
