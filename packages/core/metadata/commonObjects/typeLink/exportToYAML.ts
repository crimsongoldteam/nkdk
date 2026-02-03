import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataFieldToYAML } from "../metadataField/exportToYAML"
import { TypeLink, TypeLinkEnterprise } from "./types"

export const exportTypeLinkToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: TypeLink | undefined
): TypeLinkEnterprise | undefined => {
  if (!data) return undefined

  const dataPathEnterprise = exportMetadataFieldToYAML(context, undefined, _rule, data.dataPath)
  if (!dataPathEnterprise) return undefined

  // Добавляем linkItem в скобках, если он не равен 0
  if (data.linkItem !== 0) {
    return `${dataPathEnterprise}(${data.linkItem})`
  }

  return dataPathEnterprise
}
