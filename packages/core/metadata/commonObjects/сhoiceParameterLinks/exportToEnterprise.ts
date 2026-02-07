import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataFieldToEnterprise } from "../metadataField/exportToEnterprise"
import { ChoiceParameterLinks, ChoiceParameterLinksEnterprise } from "./types"

export const exportChoiceParameterLinksToEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: ChoiceParameterLinks | undefined
): ChoiceParameterLinksEnterprise | undefined => {
  if (!data) return undefined

  const result = []
  for (const link of data) {
    const dataPath = exportMetadataFieldToEnterprise(_context, undefined, link.dataPath)
    const valueChangeParam = link.valueChange === "DontChange" ? ", НеИзменять" : ""
    result.push(`${link.name}(${dataPath}${valueChangeParam})`)
  }
  return result.join(", ")
}
