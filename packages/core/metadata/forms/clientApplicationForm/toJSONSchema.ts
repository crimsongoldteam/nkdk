import { TSchema } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { ClientApplicationFormRules } from "./rules"
import { ClientApplicationForm } from "./types"

export const exportClientApplicationFormToJSONSchema = (params: {
  context: ConfigurationContext
  value: ClientApplicationForm
}): TSchema => {
  const { context, value: form } = params

  const schema = exportMetadataItemToJSONSchema({
    context,
    rule: ClientApplicationFormRules,
    value: form,
  })

  return schema
}
