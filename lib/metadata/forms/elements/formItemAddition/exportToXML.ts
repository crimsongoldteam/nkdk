import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { exportChildItemsToXML } from "~/lib/metadata/forms/childItems/exportToXML"
import { exportBaseElementToXML } from "~/lib/metadata/forms/elements/baseElement/exportToXML"
import { exportCommandBarToXML } from "~/lib/metadata/forms/elements/commandBar/exportToXML"
import { exportFormDecorationToXML } from "~/lib/metadata/forms/elements/formDecoration/exportToXML"
import { FormItemAddition, FormItemAdditionXML } from "~/lib/metadata/forms/elements/formItemAddition/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { registerExport } from "~/lib/xml/export/exporterFactory"

export const exportFormItemAdditionToXML = (data: FormItemAddition | undefined): FormItemAdditionXML | undefined => {
  if (!data) return undefined

  return {
    ...exportBaseElementToXML(data)!,

    ContextMenu: exportCommandBarToXML(data.contextMenu),
    _DisplayImportance: data.displayImportance,
    Enabled: data.enabled,
    ExtendedToolTip: exportFormDecorationToXML(data.extendedToolTip),
    HorizontalAlignInGroup: data.horizontalAlignInGroup,
    Name: data.name,
    Title: exportI8nTextToXML(data.title),
    ToolTip: exportI8nTextToXML(data.toolTip),
    ToolTipRepresentation: data.toolTipRepresentation,
    Type: data.type,
    VerticalAlignInGroup: data.verticalAlignInGroup,
    Visible: data.visible,
    ChildItems: exportChildItemsToXML(data.childItems),
    UserVisible: exportUserVisibleToXML(data.userVisible),
  }
}

registerExport(FormElementType.FormItemAddition, exportFormItemAdditionToXML)
