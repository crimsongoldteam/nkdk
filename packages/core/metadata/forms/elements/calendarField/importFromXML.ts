import { TypeRules } from "~/metadata/commonObjects/rules"
import { ConfigurationContext } from "~/metadata/context/types"
import { CalendarField } from "~/metadata/forms/elements/calendarField/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ImportFromXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { importBaseElementFromXML } from "../baseElement/importFromXML"
import { CalendarFieldRulesXMLMap, PropertyRule } from "./rules"

// Импорты для специальных типов

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

  const propertiesXmlMap = CalendarFieldRulesXMLMap.properties

  for (const [xmlKey, xmlValue] of Object.entries(xml) as [string, any][]) {
    const rule = propertiesXmlMap[xmlKey]

    if (rule === undefined) throw new Error(`Unknown property ${xmlKey}`)

    // Получаем TypeRule для данного типа свойства
    const typeRules = TypeRules[rule.type]
    if (typeRules === undefined) {
      result[propertyName] = xmlValue
      continue
    }

    const typeRule = typeRules[0]
    if (typeRule.importFromXML) {
      const importedValue = typeRule.importFromXML(context, rule, xmlValue)
      ;(result as any)[propertyName] = importedValue
    } else {
      ;(result as any)[propertyName] = xmlValue
    }
  }

  return result as To
}

registerMetadata("ImportFromXML", "CalendarField", importCalendarFieldFromXML as ImportFromXMLFn)
