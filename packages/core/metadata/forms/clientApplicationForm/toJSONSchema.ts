import { TSchema } from "typebox"
import type { ExportToJSONSchemaFn } from "../../ruleRuntime"
import { exportMetadataItemToJSONSchema } from "../../ruleRuntime/metadataItem/toJSONSchema"
import { ClientApplicationFormRules } from "./rules"

export const exportClientApplicationFormToJSONSchema: ExportToJSONSchemaFn = ({ context }): TSchema =>
  exportMetadataItemToJSONSchema({
    context,
    rule: ClientApplicationFormRules,
  })
