import type { PropertyRule } from "../../ruleRuntime/property/types"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { exportDataPathStandardMembersToYAML } from "../metadataPath/dataPathStandardMembers"
import type { ChoiceParameterLinks, ChoiceParameterLinksYAML } from "./types"

export const exportChoiceParameterLinksToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: ChoiceParameterLinks | undefined
): ChoiceParameterLinksYAML | undefined => {
  if (!data) return undefined

  return data.map((link) => ({
    Имя: link.name,
    ПутьКДанным: exportDataPathStandardMembersToYAML(context, link.dataPath) as string,
    ...(link.valueChange === "DontChange" ? { РежимИзменения: "НеИзменять" as const } : {}),
  }))
}

export const metadataPropertyRule000 = definePropertyTypeRule("ChoiceParameterLinks", "exportToYAML", exportChoiceParameterLinksToYAML)
