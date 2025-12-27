import { importColorFromXML } from "~/packages/core/metadata/commonObjects/color/importFromXML"
import { importUserVisibleFromXML } from "~/packages/core/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/packages/core/metadata/context/types"
import { importFormFieldFromXML } from "~/packages/core/metadata/forms/elements/formField/importFromXML"
import {
  GeographicalSchemaField,
  GeographicalSchemaFieldXML,
} from "~/packages/core/metadata/forms/elements/geographicalSchemaField/types"
import { importEventsFromXML } from "~/packages/core/metadata/forms/events/importFromXML"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/packages/core/metadata/metadataFactory/types"

export const importGeographicalSchemaFieldFromXML = (
  context: Context,
  xml: GeographicalSchemaFieldXML | undefined
): GeographicalSchemaField | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormFieldFromXML(context, xml)!,
    elementType: FormElementType.GeographicalSchemaField,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    borderColor: importColorFromXML(context, xml.BorderColor),
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    output: xml.Output,
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    events: importEventsFromXML(context, xml.Events),
  })
}

registerMetadata("ImportFromXML", "GeographicalSchemaField", importGeographicalSchemaFieldFromXML)
