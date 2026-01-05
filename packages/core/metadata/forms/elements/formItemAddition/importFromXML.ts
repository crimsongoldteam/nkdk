import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importBaseElementFromXML } from "~/metadata/forms/elements/baseElement/importFromXML"
import { importChildItemsFromXML } from "~/metadata/forms/elements/childItems/importFromXML"
import { importCommandBarFromXML } from "~/metadata/forms/elements/commandBar/importFromXML"
import { importFormDecorationFromXML } from "~/metadata/forms/elements/formDecoration/importFromXML"
import { FormItemAddition, FormItemAdditionXML } from "~/metadata/forms/elements/formItemAddition/types"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importFormItemAdditionFromXML = (
  context: ConfigurationContext,
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
