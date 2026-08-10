import { Type } from "typebox"
import { definePropertyTypeRule } from "../../ruleRuntime"
import { exportSystemEnumerationToJSONSchema } from "../../systemEnumerations/toJSONSchema"

export const exportCommonAttributeContentToJSONSchema = ({
  context,
}: Parameters<typeof exportSystemEnumerationToJSONSchema>[0]) =>
  Type.Array(
    Type.Object(
      {
        Объект: Type.String(),
        Использование: exportSystemEnumerationToJSONSchema({
          context,
          rule: { type: "SystemEnumeration", typeSE: "CommonAttributeUse" },
          value: undefined,
        })!,
        УсловноеРазделение: Type.Optional(Type.String()),
      },
      { additionalProperties: false }
    )
  )

export const metadataPropertyRule000 = definePropertyTypeRule("CommonAttributeContent", "exportToJSONSchema", exportCommonAttributeContentToJSONSchema)
