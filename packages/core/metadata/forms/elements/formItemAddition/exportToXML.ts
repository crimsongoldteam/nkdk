import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportBaseElementToXML } from "~/metadata/forms/elements/baseElement/exportToXML"
import { exportChildItemsToXML } from "~/metadata/forms/elements/childItems/exportToXML"
import { exportCommandBarToXML } from "~/metadata/forms/elements/commandBar/exportToXML"
import { exportFormDecorationToXML } from "~/metadata/forms/elements/formDecoration/exportToXML"
import { FormItemAddition, FormItemAdditionXML } from "~/metadata/forms/elements/formItemAddition/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportFormItemAdditionToXML = (
  context: ConfigurationContext,
  data: FormItemAddition | undefined
): FormItemAdditionXML | undefined => {
  if (!data) return undefined

  const baseFields = exportBaseElementToXML(context, data)
  if (!baseFields) return undefined

  return {
    ...baseFields,

    ChildItems: exportChildItemsToXML(context, data.childItems),
    ContextMenu: exportCommandBarToXML(context, data.contextMenu),
    _DisplayImportance: data.displayImportance,
    Enabled: data.enabled,
    ExtendedToolTip: exportFormDecorationToXML(context, data.extendedToolTip),
    HorizontalAlignInGroup: data.horizontalAlignInGroup,
    Title: exportI8nTextToXML(context, data.title),
    ToolTip: exportI8nTextToXML(context, data.toolTip),
    ToolTipRepresentation: data.toolTipRepresentation,
    Type: data.type,
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
    VerticalAlignInGroup: data.verticalAlignInGroup,
    Visible: data.visible,  }
}

registerMetadata("ExportToXML", "FormItemAddition", exportFormItemAdditionToXML)
