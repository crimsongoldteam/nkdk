import { ConfigurationContext } from "../context/types"
import { exportElementPropsToXML } from "../forms/elements/baseElement/exportToXML"
import { NamedElement } from "../forms/elements/baseElement/types"
import { exportEventsToXML } from "../forms/events/exportToXML"
import { FormElementType, ToXMLType } from "./types"
import { getElementRule } from "./elementRulesFactory"
import { getTypeRule } from "./typeRulesFactory"

export function exportElementToXML<T extends NamedElement>(
	context: ConfigurationContext,
	elementType: FormElementType,
	data: T | undefined
): ToXMLType<T> | undefined {
	if (data === undefined) return undefined

	const baseFields = exportElementPropsToXML(context, undefined, { name: data.name })

	const result: any = {
		...baseFields,
	}

	const rules = getElementRule<T>(elementType)

	for (const [key, rule] of Object.entries(rules.properties)) {
		const value = (data as any)[key]

		if (value === undefined) continue

		const xmlKey = (rule.xml ?? key.charAt(0).toUpperCase() + key.slice(1)) as string

		// Try to get type-specific export function
		const typeExportFn = getTypeRule(rule.type, "exportToXML")

		if (typeExportFn) {
			const exportedValue = typeExportFn(context, rule, value)
			if (exportedValue !== undefined) {
				result[xmlKey] = exportedValue
			}
		} else if (typeof value !== "object" || value === null) {
			// Simple value
			result[xmlKey] = value
		}
	}

	const dataAny = data as any
	if (rules.events !== undefined && dataAny.events !== undefined && Object.keys(dataAny.events).length > 0) {
		const events = exportEventsToXML(context, undefined, dataAny.events)
		if (events !== undefined) {
			result.Events = events
		}
	}

	return result as ToXMLType<T>
}
