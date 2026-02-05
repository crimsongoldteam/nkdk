import { ConfigurationContext } from "~/metadata/context/types"
import { CalendarField } from "~/metadata/forms/elements/calendarField/types"
import { importElementFromXML } from "~/metadata/metadataFactory"
import { FormElementType, ToXMLType } from "~/metadata/metadataFactory/types"

export function importCalendarFieldFromXML<To extends CalendarField | undefined>(
  context: ConfigurationContext,
  xml: ToXMLType<To> | undefined
): To {
  return importElementFromXML<CalendarField>(context, FormElementType.CalendarField, xml) as To
}
