import { TSchema } from "@sinclair/typebox"
import type { ExportToJSONSchemaFn } from "~/metadata/orchestration"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { ClientApplicationFormRules } from "./rules"

export const exportClientApplicationFormToJSONSchema: ExportToJSONSchemaFn = ({ context }): TSchema =>
  exportMetadataItemToJSONSchema({
    context,
    rule: ClientApplicationFormRules,
  })
