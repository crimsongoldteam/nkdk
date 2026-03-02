import { TSchema, Type } from "@sinclair/typebox"
import { InputField } from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"
import { InputFieldRules } from "./rules"

export const exportInputFieldToJSONSchema = (params: {context: ConfigurationContext,
    rule: typeof InputFieldRules,
     value: InputField}): TSchema => {
    const { context, rule, value } = params
   const properties =
  const result = Type.Object(properties, { additionalProperties: false })
  return result
}
