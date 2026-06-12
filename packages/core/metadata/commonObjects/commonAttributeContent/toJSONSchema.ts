import { Type } from "@sinclair/typebox"
import { registerTypeRule } from "~/metadata/orchestration"
import { exportSystemEnumerationToJSONSchema } from "~/metadata/systemEnumerations/toJSONSchema"

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

registerTypeRule("CommonAttributeContent", "exportToJSONSchema", exportCommonAttributeContentToJSONSchema)
