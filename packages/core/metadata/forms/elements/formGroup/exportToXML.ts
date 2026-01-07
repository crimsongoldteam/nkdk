import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportBaseElementToXML } from "~/metadata/forms/elements/baseElement/exportToXML"
import { exportChildItemsToXML } from "~/metadata/forms/elements/childItems/exportToXML"
import { exportFormDecorationToXML } from "~/metadata/forms/elements/formDecoration/exportToXML"
import { FormGroup, FormGroupXML } from "~/metadata/forms/elements/formGroup/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportFormGroupToXML = (
  context: ConfigurationContext,
  data: FormGroup | undefined
): FormGroupXML | undefined => {
  if (!data) return undefined

  return {
    const baseFields = exportBaseElementToXML(context, data)
  if (!baseFields) return undefined

  return {
    ...baseFields,,

    ChildItems: exportChildItemsToXML(context, data.childItems),
    EnableContentChange: data.enableContentChange,
    Enabled: data.enabled,
    ExtendedTooltip: exportFormDecorationToXML(context, data.extendedTooltip),
    Height: data.height,
    HorizontalAlignInGroup: data.horizontalAlignInGroup,
    HorizontalStretch: data.horizontalStretch,
    ReadOnly: data.readOnly,
    Shortcut: data.shortcut,
    Title: exportI8nTextToXML(context, data.title),
    TitleFont: exportFontToXML(context, data.titleFont),
    TitleTextColor: exportColorToXML(context, data.titleTextColor),
    ToolTip: exportI8nTextToXML(context, data.toolTip),
    ToolTipRepresentation: data.toolTipRepresentation,
    Type: data.type,
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
    VerticalAlignInGroup: data.verticalAlignInGroup,
    VerticalStretch: data.verticalStretch,
    Visible: data.visible,
    Width: data.width,  }
}

registerMetadata<FormGroup>("ExportToXML", "FormGroup", exportFormGroupToXML)
