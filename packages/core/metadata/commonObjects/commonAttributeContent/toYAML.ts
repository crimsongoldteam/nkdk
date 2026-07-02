import { ConfigurationContext } from "../../context/types"
import { PropertyRule, registerTypeRule } from "../../orchestration"
import { exportSystemEnumerationToYAML } from "../../systemEnumerations/toYAML"
import * as SE from "../../systemEnumerations/types"
import { exportCommonAttributeContentPathToYAML } from "./metadataPath"
import { CommonAttributeContent, CommonAttributeContentYAML } from "./types"

const commonAttributeUseRule: SE.SystemEnumerationPropertyRule = {
  type: "SystemEnumeration",
  typeSE: "CommonAttributeUse",
}

export const exportCommonAttributeContentToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: CommonAttributeContent | undefined
): CommonAttributeContentYAML | undefined => {
  if (!value) return undefined

  return value.map((item) => ({
    Объект: exportCommonAttributeContentPathToYAML(context, item.metadata),
    Использование: exportSystemEnumerationToYAML<SE.CommonAttributeUseYAML>(context, commonAttributeUseRule, item.use)!,
    УсловноеРазделение: exportCommonAttributeContentPathToYAML(context, item.conditionalSeparation ?? ""),
  }))
}

registerTypeRule("CommonAttributeContent", "exportToYAML", exportCommonAttributeContentToYAML)
