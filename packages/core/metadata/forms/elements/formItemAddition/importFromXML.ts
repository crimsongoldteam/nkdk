import { importI8nTextFromXML } from "~/packages/core/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/packages/core/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/packages/core/metadata/context/types"
import { importBaseElementFromXML } from "~/packages/core/metadata/forms/elements/baseElement/importFromXML"
import { importChildItemsFromXML } from "~/packages/core/metadata/forms/elements/childItems/importFromXML"
import { importCommandBarFromXML } from "~/packages/core/metadata/forms/elements/commandBar/importFromXML"
import { importFormDecorationFromXML } from "~/packages/core/metadata/forms/elements/formDecoration/importFromXML"
import { FormItemAddition, FormItemAdditionXML } from "~/packages/core/metadata/forms/elements/formItemAddition/types"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/packages/core/metadata/metadataFactory/types"

export const importFormItemAdditionFromXML = (
  context: Context,
  xml: FormItemAdditionXML | undefined
): FormItemAddition | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importBaseElementFromXML(context, xml)!,
    elementType: FormElementType.FormItemAddition,

    childItems: importChildItemsFromXML(context, xml.ChildItems),
    contextMenu: importCommandBarFromXML(context, xml.ContextMenu),
    displayImportance: xml._DisplayImportance,
    enabled: xml.Enabled,
    extendedToolTip: importFormDecorationFromXML(context, xml.ExtendedToolTip),
    horizontalAlignInGroup: xml.HorizontalAlignInGroup,
    title: importI8nTextFromXML(context, xml.Title),
    toolTip: importI8nTextFromXML(context, xml.ToolTip),
    toolTipRepresentation: xml.ToolTipRepresentation,
    type: xml.Type,
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    verticalAlignInGroup: xml.VerticalAlignInGroup,
    visible: xml.Visible,
  })
}

registerMetadata("ImportFromXML", "FormItemAddition", importFormItemAdditionFromXML)
