import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContext } from "~/metadata/context/types"
import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { FormElementType } from "../metadataType/types"
import { PropertyRule } from "../properties/types"
import { getTypeRule } from "../types/factory"
import { TypeRulesNames } from "../types/types"
import { getElementRule } from "./factory"

export const exportElementToEnterprise = <T extends NamedElement>(
  context: ConfigurationContext,
  itemType: FormElementType,
  data: T | undefined
): ToEnterpriseType<T> | undefined => {
  if (data === undefined) return undefined

  const rules = getElementRule<T>(itemType)

  const result: any = {
    itemType: rules.enterpriseField,
    Name: data.name,
  }

  for (const [key, rule] of Object.entries(rules.properties) as [string, PropertyRule<T>][]) {
    if (rule.toYAML === false) continue

    const value = (data as any)[key]

    const enterpriseKey = capitalize(key)

    const typeExportFn = getTypeRule(rule.type as TypeRulesNames, "exportToEnterprise")

    if (!typeExportFn) {
      result[enterpriseKey] = value
      continue
    }

    const exportedValue = typeExportFn(context, rule, value)
    if (exportedValue !== undefined) {
      result[enterpriseKey] = exportedValue
    }
  }

  return result as ToEnterpriseType<T>
}
