import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/lib/metadata/context/types"
import { exportBaseElementToXML } from "~/lib/metadata/forms/elements/baseElement/exportToXML"
import { exportChildItemsToXML } from "~/lib/metadata/forms/elements/childItems/exportToXML"
import { exportCommandBarToXML } from "~/lib/metadata/forms/elements/commandBar/exportToXML"
import { exportFormDecorationToXML } from "~/lib/metadata/forms/elements/formDecoration/exportToXML"
import { FormItemAddition, FormItemAdditionXML } from "~/lib/metadata/forms/elements/formItemAddition/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportFormItemAdditionToXML = (
  context: Context,
  data: FormItemAddition | undefined
): FormItemAdditionXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportBaseElementToXML(context, data)!,

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
    Visible: data.visible,
  })
}

registerMetadata("ExportToXML", "FormItemAddition", exportFormItemAdditionToXML)
