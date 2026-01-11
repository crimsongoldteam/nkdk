import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportButtonGroupChildItemsToXML } from "~/metadata/forms/collections/buttonGroupChildItems/exportToXML"
import { ButtonGroup, ButtonGroupXML } from "~/metadata/forms/elements/buttonGroup/types"
import { exportFormGroupToXML } from "~/metadata/forms/elements/formGroup/exportToXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportButtonGroupToXML = (
  context: ConfigurationContext,
  data: ButtonGroup | undefined
): ButtonGroupXML | undefined => {
  if (!data) return undefined

  const baseFields = exportFormGroupToXML(context, data)
  if (!baseFields) return undefined

  const result: ButtonGroupXML = {
    ...baseFields,
  }

  const childItems = exportButtonGroupChildItemsToXML(context, data.childItems)
  if (childItems !== undefined) result.ПодчиненныеЭлементы = childItems

  if (data.representation !== undefined) result.Representation = data.representation

  const userVisible = exportUserVisibleToXML(context, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  return result
}

registerMetadata("ExportToXML", "ButtonGroup", exportButtonGroupToXML)
