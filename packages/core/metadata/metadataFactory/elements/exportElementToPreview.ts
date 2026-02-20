// import { capitalize } from "~/helpers/capitalize"
// import { ConfigurationContext } from "~/metadata/context/types"
// import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
// import { getElementRule } from "../elementRulesFactory"
// import { FormElementType } from "../metadataType/types"
// import { PropertyRule } from "../properties/types"
// import { getTypeRule, TypeRulesNames } from "../typeRulesFactory"
// import { ToPreviewType } from "../types"

// export function exportElementToPreview<T extends NamedElement>(
//   context: ConfigurationContext,
//   itemType: FormElementType,
//   data: T | undefined
// ): ToPreviewType<T> | undefined {
//   if (data === undefined) return undefined

//   const rules = getElementRule<T>(itemType)

//   const result: any = {
//     itemType: rules.enterpriseField,
//     Name: data.name,
//   }

//   for (const [key, rule] of Object.entries(rules.properties) as [string, PropertyRule<T>][]) {
//     if (rule.toYAML === false) continue

//     const value = (data as any)[key]

//     const enterpriseKey = capitalize(key)

//     const typeExportFn = getTypeRule(rule.type as TypeRulesNames, "exportToPreview")

//     if (!typeExportFn) {
//       result[enterpriseKey] = value
//       continue
//     }

//     const exportedValue = typeExportFn(context, rule, value)
//     if (exportedValue !== undefined) {
//       result[enterpriseKey] = exportedValue
//     }
//   }

//   return result as ToPreviewType<T>
// }
