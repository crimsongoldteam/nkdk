import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { importSystemEnumerationFromYAML } from "~/metadata/systemEnumerations/fromYAML"
import * as SE from "~/metadata/systemEnumerations/types"
import { importCommonAttributeContentPathFromYAML } from "./metadataPath"
import { CommonAttributeContent, CommonAttributeContentYAML } from "./types"

const commonAttributeUseRule: SE.SystemEnumerationPropertyRule = {
  type: "SystemEnumeration",
  typeSE: "CommonAttributeUse",
}

export const importCommonAttributeContentFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  yaml: CommonAttributeContentYAML | undefined
): CommonAttributeContent | undefined => {
  if (!yaml) return undefined

  return yaml.map((item) => ({
    metadata: importCommonAttributeContentPathFromYAML(context, item.Объект),
    use: importSystemEnumerationFromYAML<SE.CommonAttributeUse>({
      context,
      rule: commonAttributeUseRule,
      value: item.Использование,
    })!,
    conditionalSeparation: importCommonAttributeContentPathFromYAML(context, item.УсловноеРазделение ?? ""),
  }))
}

registerTypeRule("CommonAttributeContent", "importFromYAML", importCommonAttributeContentFromYAML)
