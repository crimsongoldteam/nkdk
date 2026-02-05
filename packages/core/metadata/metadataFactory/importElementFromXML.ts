import { ConfigurationContext } from "../context/types"
import { importBaseElementFromXML } from "../forms/elements/baseElement/importFromXML"
import { NamedElement } from "../forms/elements/baseElement/types"
import { FormElementType, ToXMLType } from "./types"
import { getElementRule } from "./elementRulesFactory"
import { importPropertyFromXML } from "./importPropertyFromXML"

export function importElementFromXML<T extends NamedElement>(
	context: ConfigurationContext,
	elementType: FormElementType,
	xml: ToXMLType<T> | undefined
): T | undefined {
	if (xml === undefined) return undefined

	const baseFields = importBaseElementFromXML(context, undefined, xml as any)

	const result: T = {
		...baseFields,
		elementType: elementType as any,
	} as T

	const rules = getElementRule<T>(elementType)

	for (const [key, rule] of Object.entries(rules.properties)) {
		const xmlKey = (rule.xml ?? key.charAt(0).toUpperCase() + key.slice(1)) as keyof typeof xml

		const xmlValue = (xml as any)[xmlKey]

		if (!xmlValue) continue

		const value = importPropertyFromXML(context, rule, xmlValue)

		;(result as any)[key] = value
	}

	if (rules.events !== undefined && (xml as any).Events !== undefined) {
		;(result as any).events = {}
		for (const key of Object.keys(rules.events)) {
			const xmlKey = key.charAt(0).toUpperCase() + key.slice(1)

			const xmlValue = ((xml as any).Events as any)[xmlKey]

			if (!xmlValue) continue
			;(result as any).events[key] = xmlValue
		}
	}

	return result
}
