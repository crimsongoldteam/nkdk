import { importUserVisibleFromXML } from "~/packages/core/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/packages/core/metadata/context/types"
import { DendrogramField, DendrogramFieldXML } from "~/packages/core/metadata/forms/elements/dendrogramField/types"
import { importFormFieldFromXML } from "~/packages/core/metadata/forms/elements/formField/importFromXML"
import { importEventsFromXML } from "~/packages/core/metadata/forms/events/importFromXML"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/packages/core/metadata/metadataFactory/types"

export const importDendrogramFieldFromXML = (
  context: Context,
  xml: DendrogramFieldXML | undefined
): DendrogramField | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormFieldFromXML(context, xml)!,
    elementType: FormElementType.DendrogramField,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    events: importEventsFromXML(context, xml.Events),
  })
}

registerMetadata("ImportFromXML", "DendrogramField", importDendrogramFieldFromXML)
