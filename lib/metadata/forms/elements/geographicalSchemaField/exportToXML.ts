import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { exportFormFieldToXML } from "~/lib/metadata/forms/elements/formField/exportToXML"
import {
  GeographicalSchemaField,
  GeographicalSchemaFieldXML,
} from "~/lib/metadata/forms/elements/geographicalSchemaField/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { registerExport } from "~/lib/xml/export/exporterFactory"

export const exportGeographicalSchemaFieldToXML = (
  data: GeographicalSchemaField | undefined
): GeographicalSchemaFieldXML | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToXML(data)!,

    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    BorderColor: exportColorToXML(data.borderColor),
    Height: data.height,
    HorizontalStretch: data.horizontalStretch,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    Output: data.output,
    VerticalStretch: data.verticalStretch,
    Width: data.width,
    UserVisible: exportUserVisibleToXML(data.userVisible),
    Events: exportEventsToXML(data.events),
  }
}

registerExport(FormElementType.GeographicalSchemaField, exportGeographicalSchemaFieldToXML)
