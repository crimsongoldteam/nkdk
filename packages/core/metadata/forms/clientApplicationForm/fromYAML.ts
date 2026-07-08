import { ConfigurationContext, FormDataPathAttributeContext } from "../../context/types"
import type { FormAttributeYAML, FormAttributesYAML } from "../commonObjects/formAttribute/types"
import { importMetadataItemFromYAML } from "../../orchestration"
import { ClientApplicationFormRules } from "./rules"
import { ClientApplicationForm, ClientApplicationFormYAML } from "./types"

export const importClientApplicationFormFromYAML = (
  context: ConfigurationContext,
  data: ClientApplicationFormYAML,
  source?: ClientApplicationForm,
  name?: string
): ClientApplicationForm => {
  const contextWithAttributes: ConfigurationContext = context.importFromYAML
    ? {
        ...context,
        importFromYAML: {
          ...context.importFromYAML,
          formAttributes: formDataPathAttributesFromYAML(data.Реквизиты),
        },
      }
    : context

  const properties = importMetadataItemFromYAML({
    context: contextWithAttributes,
    yaml: data,
    rule: ClientApplicationFormRules,
    source,
    name,
  })

  if (properties == undefined) throw new Error("Properties are required")

  return properties
}

function formDataPathAttributesFromYAML(attributes: FormAttributesYAML | undefined): FormDataPathAttributeContext[] {
  if (attributes === undefined) return []

  return Object.entries(attributes).map(([name, attribute]) => ({
    name,
    type: isDynamicListType(attribute.Тип) ? { type: ["DynamicList"] } : undefined,
    dynamicList: attribute.ДинамическийСписок,
  }))
}

function isDynamicListType(type: FormAttributeYAML["Тип"]): boolean {
  if (typeof type === "string") return type === "ДинамическийСписок" || type === "DynamicList"
  if (Array.isArray(type)) return type.includes("ДинамическийСписок") || type.includes("DynamicList")
  return false
}
