import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataFieldToYAML } from "../metadataField/toYAML"
import { TypeLink, TypeLinkYAML } from "./types"

export const exportTypeLinkToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: TypeLink | undefined
): TypeLinkYAML | undefined => {
  if (!data) return undefined

  const dataPathYAML = exportMetadataFieldToYAML(context, undefined, data.dataPath)
  if (!dataPathYAML) return undefined

  // Добавляем linkItem в скобках, если он не равен 0
  if (data.linkItem !== 0) {
    return `${dataPathYAML}(${data.linkItem})`
  }

  return dataPathYAML
}

registerTypeRule("TypeLink", "exportToYAML", exportTypeLinkToYAML)
