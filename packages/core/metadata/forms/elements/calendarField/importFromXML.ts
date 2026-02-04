import { TypeRules } from "~/metadata/commonObjects/rules"
import { ConfigurationContext } from "~/metadata/context/types"
import { CalendarField } from "~/metadata/forms/elements/calendarField/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { getElementRule, PropertyRule } from "~/metadata/metadataFactory/rulesFactory"
import { ImportFromXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { importBaseElementFromXML } from "../baseElement/importFromXML"

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

  const propertiesXmlMap = getElementRule("CalendarField")?.properties

  for (const [xmlKey, xmlValue] of Object.entries(xml) as [string, any][]) {
    const rule = propertiesXmlMap[xmlKey]

    if (rule === undefined) throw new Error(`Unknown property ${xmlKey}`)

    // Находим соответствующее имя свойства CalendarField
    const calendarFieldRule = getElementRule<CalendarField>("CalendarField")
    const propertyName = Object.entries(calendarFieldRule?.properties || {}).find(([, r]) => r === rule)?.[0]

    if (!propertyName) throw new Error(`Property name not found for rule`)

    // Получаем TypeRule для данного типа свойства
    const typeRules = TypeRules[rule.type]
    if (typeRules === undefined) {
      ;(result as any)[propertyName] = xmlValue
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
