import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/lib/metadata/context/types"
import { importBaseElementFromXML } from "~/lib/metadata/forms/elements/baseElement/importFromXML"
import { importChildItemsFromXML } from "~/lib/metadata/forms/elements/childItems/importFromXML"
import { importFormDecorationFromXML } from "~/lib/metadata/forms/elements/formDecoration/importFromXML"
import { FormGroup, FormGroupXML } from "~/lib/metadata/forms/elements/formGroup/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importFormGroupFromXML = (context: Context, xml: FormGroupXML | undefined): FormGroup | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importBaseElementFromXML(context, xml)!,
    elementType: FormElementType.FormGroup,

    childItems: importChildItemsFromXML(context, xml.ChildItems),
    enableContentChange: xml.EnableContentChange,
    enabled: xml.Enabled,
    extendedTooltip: importFormDecorationFromXML(context, xml.ExtendedTooltip),
    height: xml.Height,
    horizontalAlignInGroup: xml.HorizontalAlignInGroup,
    horizontalStretch: xml.HorizontalStretch,
    readOnly: xml.ReadOnly,
    shortcut: xml.Shortcut,
    title: importI8nTextFromXML(context, xml.Title),
    titleFont: importFontFromXML(context, xml.TitleFont),
    titleTextColor: importColorFromXML(context, xml.TitleTextColor),
    toolTip: importI8nTextFromXML(context, xml.ToolTip),
    toolTipRepresentation: xml.ToolTipRepresentation,
    type: xml.Type,
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    verticalAlignInGroup: xml.VerticalAlignInGroup,
    verticalStretch: xml.VerticalStretch,
    visible: xml.Visible,
    width: xml.Width,
  })
}

registerMetadata<FormGroupXML>("ImportFromXML", "FormGroup", importFormGroupFromXML)
