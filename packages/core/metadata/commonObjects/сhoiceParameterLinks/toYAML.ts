import type { PropertyRule } from "../../orchestration/property/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import type { ChoiceParameterLinks, ChoiceParameterLinksYAML } from "./types"

export const exportChoiceParameterLinksToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: ChoiceParameterLinks | undefined
): ChoiceParameterLinksYAML | undefined => {
  if (!data) return undefined

  return data.map((link) => ({
    Имя: link.name,
    ПутьКДанным: link.dataPath,
    ...(link.valueChange === "DontChange" ? { РежимИзменения: "НеИзменять" as const } : {}),
  }))
}

registerTypeRule("ChoiceParameterLinks", "exportToYAML", exportChoiceParameterLinksToYAML)
