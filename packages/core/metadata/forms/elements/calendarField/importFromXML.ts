import { importPropertyFromXML } from "~/metadata/commonObjects/rules"
import { ConfigurationContext } from "~/metadata/context/types"
import { CalendarField } from "~/metadata/forms/elements/calendarField/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { getElementRule, PropertyRule } from "~/metadata/metadataFactory/rulesFactory"
import { ImportFromXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { importBaseElementFromXML } from "../baseElement/importFromXML"

export function importCalendarFieldFromXML<To extends CalendarField | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: ToXMLType<To> | undefined
): To {
  if (xml === undefined) return undefined as To

  const baseFields = importBaseElementFromXML(context, undefined, xml)

  const result: CalendarField = {
    ...baseFields,
    elementType: "CalendarField",
  }

  const rules = getElementRule<CalendarField>("CalendarField")

  for (const [key, rule] of Object.entries(rules.properties)) {
    const xmlKey = (rule.xml ?? key.charAt(0).toUpperCase() + key.slice(1)) as keyof typeof xml

    const xmlValue = (xml as any)[xmlKey]

    const value = importPropertyFromXML(context, rule, xmlValue)

    ;(result as any)[key] = value
  }

  return result as To
}

registerMetadata("ImportFromXML", "CalendarField", importCalendarFieldFromXML as ImportFromXMLFn)
