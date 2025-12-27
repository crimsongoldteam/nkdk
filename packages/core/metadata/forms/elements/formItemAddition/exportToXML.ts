import { exportI8nTextToXML } from "~/packages/core/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/packages/core/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/packages/core/metadata/context/types"
import { exportBaseElementToXML } from "~/packages/core/metadata/forms/elements/baseElement/exportToXML"
import { exportChildItemsToXML } from "~/packages/core/metadata/forms/elements/childItems/exportToXML"
import { exportCommandBarToXML } from "~/packages/core/metadata/forms/elements/commandBar/exportToXML"
import { exportFormDecorationToXML } from "~/packages/core/metadata/forms/elements/formDecoration/exportToXML"
import { FormItemAddition, FormItemAdditionXML } from "~/packages/core/metadata/forms/elements/formItemAddition/types"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"

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
