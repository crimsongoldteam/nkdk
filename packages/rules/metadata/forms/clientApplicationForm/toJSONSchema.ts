import { Type, type TSchema } from "typebox"
import type { ExportToJSONSchemaFn } from "../../ruleRuntime"
import { exportMetadataItemToJSONSchema } from "../../ruleRuntime/metadataItem/toJSONSchema"
import { ClientApplicationFormRules, FormRulesTags } from "./rules"

export const exportClientApplicationFormToJSONSchema: ExportToJSONSchemaFn = ({ context }): TSchema => {
  const formPropertyNames = Object.values(ClientApplicationFormRules.properties)
    .filter((rule) => "tag" in rule && rule.tag === FormRulesTags.Form && "yaml" in rule && typeof rule.yaml === "string")
    .map((rule) => (rule as { readonly yaml: string }).yaml)

  return Type.Intersect([
    exportMetadataItemToJSONSchema({
      context,
      rule: ClientApplicationFormRules,
    }),
    {
      if: {
        properties: { ТипФормы: { const: "Обычная" } },
        required: ["ТипФормы"],
      },
      then: {
        not: {
          anyOf: formPropertyNames.map((name) => ({ required: [name] })),
        },
      },
    },
  ])
}
