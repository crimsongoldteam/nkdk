import { ConfigurationContext } from "../context/types"
import { NamedElement } from "../forms/elements/baseElement/types"
import { FormElementType, ToPreviewType } from "./types"
import { getElementRule } from "./elementRulesFactory"
import { getTypeRule } from "./typeRulesFactory"

export function exportElementToPreview<T extends NamedElement>(
	context: ConfigurationContext,
	elementType: FormElementType,
	data: T | undefined
): ToPreviewType<T> | undefined {
	if (data === undefined) return undefined

	const rules = getElementRule<T>(elementType)

	const result: any = {
		ElementType: "FormField",
	}

	for (const [key, rule] of Object.entries(rules.properties)) {
		const value = (data as any)[key]

		if (value === undefined) continue

		// For preview, use PascalCase key (first letter uppercase)
		const xmlKey = (rule.xml ?? key.charAt(0).toUpperCase() + key.slice(1)) as string

		// Try to get type-specific preview export function
		const typeExportFn = getTypeRule(rule.type, "exportToPreview")

		if (typeExportFn) {
			const exportedValue = typeExportFn(context, rule, value)
			if (exportedValue !== undefined) {
				result[xmlKey] = exportedValue
			}
		} else if (typeof value !== "object" || value === null) {
			// Simple value - just pass through
			result[xmlKey] = value
		}
	}

	return result as ToPreviewType<T>
}
