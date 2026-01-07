import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormFieldFromXML } from "~/metadata/forms/elements/formField/importFromXML"
import { GraphicalSchemaField, GraphicalSchemaFieldXML } from "~/metadata/forms/elements/graphicalSchemaField/types"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importGraphicalSchemaFieldFromXML = (
  context: ConfigurationContext,
  xml: GraphicalSchemaFieldXML | undefined
): GraphicalSchemaField | undefined => {
  if (!xml) return undefined
  const baseFields = importFormFieldFromXML(context, xml)
  if (!baseFields) return undefined

  return {
    ...baseFields,
    elementType: FormElementType.GraphicalSchemaField,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    borderColor: importColorFromXML(context, xml.BorderColor),
    edit: xml.Edit,
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    output: xml.Output,
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    events: importEventsFromXML(context, xml.Events),
  }
}

registerMetadata("ImportFromXML", "GraphicalSchemaField", importGraphicalSchemaFieldFromXML)
