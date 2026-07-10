import type { ConfigurationContext, FormDataPathAttributeContext } from "../../context/types"
import type { FormAttributesYAML } from "../commonObjects/formAttribute/types"
import { importMetadataItemFromYAML } from "../../orchestration"
import { ClientApplicationFormRules } from "./rules"
import { ClientApplicationForm, ClientApplicationFormYAML } from "./types"

const FormAttributesOnlyRules = {
  ...ClientApplicationFormRules,
  properties: {
    attributes: ClientApplicationFormRules.properties.attributes,
  },
}

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
          formAttributes: importFormAttributesForDataPath(context, data.Реквизиты),
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

function importFormAttributesForDataPath(
  context: ConfigurationContext,
  attributes: FormAttributesYAML | undefined
): FormDataPathAttributeContext[] {
  if (attributes === undefined) return []

  const imported = importMetadataItemFromYAML({
    context,
    yaml: { Реквизиты: attributes },
    rule: FormAttributesOnlyRules as typeof ClientApplicationFormRules,
  }) as { attributes?: FormDataPathAttributeContext[] } | undefined
  return imported?.attributes ?? []
}
