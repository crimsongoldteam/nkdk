import { TSchema } from "typebox"
import type { ExportToJSONSchemaFn } from "../../orchestration"
import { exportMetadataItemToJSONSchema } from "../../orchestration/metadataItem/toJSONSchema"
import { ClientApplicationFormRules } from "./rules"

export const exportClientApplicationFormToJSONSchema: ExportToJSONSchemaFn = ({ context }): TSchema =>
  exportMetadataItemToJSONSchema({
    context,
    rule: ClientApplicationFormRules,
  })
