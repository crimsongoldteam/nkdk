import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { importBaseElementFromXML } from "~/lib/metadata/forms/elements/baseElement/importFromXML"
import { importChildItemsFromXML } from "~/lib/metadata/forms/elements/childItems/importFromXML"
import { importFormDecorationFromXML } from "~/lib/metadata/forms/elements/formDecoration/importFromXML"
import { FormGroup, FormGroupXML } from "~/lib/metadata/forms/elements/formGroup/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importFormGroupFromXML = (xml: FormGroupXML | undefined): FormGroup | undefined => {
  if (!xml) return undefined

  return {
    ...importBaseElementFromXML(xml)!,
    elementType: FormElementType.FormGroup,

    enableContentChange: xml.EnableContentChange,
    enabled: xml.Enabled,
    extendedTooltip: importFormDecorationFromXML(xml.ExtendedTooltip),
    height: xml.Height,
    horizontalAlignInGroup: xml.HorizontalAlignInGroup,
    horizontalStretch: xml.HorizontalStretch,
    readOnly: xml.ReadOnly,
    shortcut: xml.Shortcut,
    title: importI8nTextFromXML(xml.Title),
    titleFont: importFontFromXML(xml.TitleFont),
    titleTextColor: importColorFromXML(xml.TitleTextColor),
    toolTip: importI8nTextFromXML(xml.ToolTip),
    toolTipRepresentation: xml.ToolTipRepresentation,
    type: xml.Type,
    verticalAlignInGroup: xml.VerticalAlignInGroup,
    verticalStretch: xml.VerticalStretch,
    visible: xml.Visible,
    width: xml.Width,
    childItems: importChildItemsFromXML(xml.ChildItems),
    userVisible: importUserVisibleFromXML(xml.UserVisible),
  }
}

registerImport(FormElementType.FormGroup, importFormGroupFromXML)
