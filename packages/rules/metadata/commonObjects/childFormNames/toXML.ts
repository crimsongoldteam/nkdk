import { ExportToXMLFunctionNew, definePropertyTypeRule } from "../../ruleRuntime"
import { orderAndPersistNamedChildren } from "../omittedChildren"

/** Экспортирует список имён форм с сохранённым порядком актуальных элементов. */
export const exportChildFormNamesToXML: ExportToXMLFunctionNew = (params): string[] | undefined => {
  const { context, value, referenceMetadata } = params
  const runtime = context.exportToXML.configurationIndex
  const saved = runtime?.children()

  let names: readonly string[] | undefined
  if (Array.isArray(value) && value.length > 0) {
    names = value.filter((name): name is string => typeof name === "string")
  } else {
    const contextForms = context.exportToXML.context?.forms
    if (contextForms && contextForms.length > 0) names = contextForms
  }
  if (names === undefined || names.length === 0) return undefined

  const referenceNames = Array.isArray(referenceMetadata)
    ? referenceMetadata.filter((name): name is string => typeof name === "string")
    : undefined
  const referenceChildren = referenceNames?.map((name) => ({ xmlName: "Form", name }))
  return orderAndPersistNamedChildren({ xmlName: "Form", names, saved: saved ?? referenceChildren, runtime })
}

export const metadataPropertyRule000 = definePropertyTypeRule("ChildFormNames", "exportToXML", exportChildFormNamesToXML)
