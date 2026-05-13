import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { importSystemEnumerationFromYAML } from "~/metadata/systemEnumerations/fromYAML"
import { importCommonAttributeContentPathFromYAML } from "./metadataPath"
import { CommonAttributeContent, CommonAttributeContentYAML } from "./types"

export const importCommonAttributeContentFromYAML = (
  context: unknown,
  _rule: unknown,
  yaml: CommonAttributeContentYAML | undefined
): CommonAttributeContent | undefined => {
  if (!yaml) return undefined

  return yaml.map((item) => ({
    metadata: importCommonAttributeContentPathFromYAML(context as never, item.Объект),
    use: importSystemEnumerationFromYAML({
      context: context as never,
      rule: { type: "SystemEnumeration", typeSE: "CommonAttributeUse" } as never,
      value: item.Использование,
    }) as never,
    conditionalSeparation: importCommonAttributeContentPathFromYAML(context as never, item.УсловноеРазделение ?? ""),
  }))
}

registerTypeRule("CommonAttributeContent", "importFromYAML", importCommonAttributeContentFromYAML as never)
