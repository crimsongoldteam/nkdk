import { importColorFromXML } from "~/packages/core/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/packages/core/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/packages/core/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/packages/core/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/packages/core/metadata/context/types"
import { importBaseElementFromXML } from "~/packages/core/metadata/forms/elements/baseElement/importFromXML"
import { importCommandBarFromXML } from "~/packages/core/metadata/forms/elements/commandBar/importFromXML"
import { FormDecoration, FormDecorationXML } from "~/packages/core/metadata/forms/elements/formDecoration/types"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/packages/core/metadata/metadataFactory/types"

export const importFormDecorationFromXML = (
  context: Context,
  xml: FormDecorationXML | undefined
): FormDecoration | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importBaseElementFromXML(context, xml)!,
    elementType: FormElementType.FormDecoration,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    contextMenu: importCommandBarFromXML(context, xml.ContextMenu),
    displayImportance: xml._DisplayImportance,
    enabled: xml.Enabled,
    extendedTooltip: importFormDecorationFromXML(context, xml.ExtendedTooltip),
    font: importFontFromXML(context, xml.Font),
    height: xml.Height,
    horizontalAlignInGroup: xml.HorizontalAlignInGroup,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    shortcut: xml.Shortcut,
    skipOnInput: xml.SkipOnInput,
    textColor: importColorFromXML(context, xml.TextColor),
    title: importI8nTextFromXML(context, xml.Title),
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

registerMetadata("ImportFromXML", "FormDecoration", importFormDecorationFromXML)
