import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataFieldToYAML } from "../metadataField/toYAML"
import { ChoiceParameterLinks, ChoiceParameterLinksYAML } from "./types"

export const exportChoiceParameterLinksToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: ChoiceParameterLinks | undefined
): ChoiceParameterLinksYAML | undefined => {
  if (!data) return undefined

  const result = []
  for (const link of data) {
    const dataPath = exportMetadataFieldToYAML(_context, undefined, link.dataPath)
    const valueChangeParam = link.valueChange === "DontChange" ? ", НеИзменять" : ""
    result.push(`${link.name}(${dataPath}${valueChangeParam})`)
  }
  return result.join(", ")
}

registerTypeRule("ChoiceParameterLinks", "exportToYAML", exportChoiceParameterLinksToYAML)
