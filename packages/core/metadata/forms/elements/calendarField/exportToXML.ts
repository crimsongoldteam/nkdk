import { ConfigurationContext } from "~/metadata/context/types"
import { CalendarField } from "~/metadata/forms/elements/calendarField/types"
import { exportElementToXML } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToXMLFn, FormElementType, ToXMLType } from "~/metadata/metadataFactory/types"

export function exportCalendarFieldToXML<From extends CalendarField | undefined>(
  context: ConfigurationContext,
  data: From
): ToXMLType<From> {
  return exportElementToXML(context, FormElementType.CalendarField, data) as ToXMLType<From>
}

registerMetadata("ExportToXML", "CalendarField", exportCalendarFieldToXML as ExportToXMLFn)
