import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { exportSystemEnumerationToYAML } from "~/metadata/systemEnumerations/toYAML"
import { exportCommonAttributeContentPathToYAML } from "./metadataPath"
import { CommonAttributeContent, CommonAttributeContentYAML } from "./types"

export const exportCommonAttributeContentToYAML = (
  context: unknown,
  _rule: unknown,
  value: CommonAttributeContent | undefined
): CommonAttributeContentYAML | undefined => {
  if (!value) return undefined

  return value.map((item) => ({
    Объект: exportCommonAttributeContentPathToYAML(context as never, item.metadata),
    Использование: exportSystemEnumerationToYAML(
      context as never,
      { type: "SystemEnumeration", typeSE: "CommonAttributeUse" } as never,
      item.use
    ) as never,
    УсловноеРазделение: exportCommonAttributeContentPathToYAML(context as never, item.conditionalSeparation ?? ""),
  }))
}

registerTypeRule("CommonAttributeContent", "exportToYAML", exportCommonAttributeContentToYAML as never)
