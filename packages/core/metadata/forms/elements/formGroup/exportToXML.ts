import { exportColorToXML } from "~/packages/core/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/packages/core/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/packages/core/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/packages/core/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/packages/core/metadata/context/types"
import { exportBaseElementToXML } from "~/packages/core/metadata/forms/elements/baseElement/exportToXML"
import { exportChildItemsToXML } from "~/packages/core/metadata/forms/elements/childItems/exportToXML"
import { exportFormDecorationToXML } from "~/packages/core/metadata/forms/elements/formDecoration/exportToXML"
import { FormGroup, FormGroupXML } from "~/packages/core/metadata/forms/elements/formGroup/types"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"

export const exportFormGroupToXML = (context: Context, data: FormGroup | undefined): FormGroupXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportBaseElementToXML(context, data)!,

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
    Width: data.width,
  })
}

registerMetadata<FormGroup>("ExportToXML", "FormGroup", exportFormGroupToXML)
