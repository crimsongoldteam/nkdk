import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { CharacteristicsDescriptionsJSONSchema } from "./types"

export const exportCharacteristicsDescriptionToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return CharacteristicsDescriptionsJSONSchema
}

registerTypeRule("CharacteristicsDescription", "exportToJSONSchema", exportCharacteristicsDescriptionToJSONSchema)
