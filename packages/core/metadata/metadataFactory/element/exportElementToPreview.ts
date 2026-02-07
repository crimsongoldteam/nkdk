import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContext } from "~/metadata/context/types"
import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { getElementRule, PropertyRule } from "../elementRulesFactory"
import { getTypeRule, TypeRulesNames } from "../typeRulesFactory"
import { FormElementType, ToPreviewType } from "../types"

export function exportElementToPreview<T extends NamedElement>(
  context: ConfigurationContext,
  elementType: FormElementType,
  data: T | undefined
): ToPreviewType<T> | undefined {
  if (data === undefined) return undefined

  const rules = getElementRule<T>(elementType)

  const result: any = {
    ElementType: rules.enterpriseField,
    Name: data.name,
  }

  for (const [key, rule] of Object.entries(rules.properties) as [string, PropertyRule][]) {
    if (rule.toEnterprise === false) continue

    const value = (data as any)[key]

    const enterpriseKey = capitalize(key)

    const typeExportFn = getTypeRule(rule.type as TypeRulesNames, "exportToPreview")

    if (!typeExportFn) {
      result[enterpriseKey] = value
      continue
    }

    const exportedValue = typeExportFn(context, rule, value)
    if (exportedValue !== undefined) {
      result[enterpriseKey] = exportedValue
    }
  }

  return result as ToPreviewType<T>
}
