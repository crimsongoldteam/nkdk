import { ExportToXMLFunctionNew, definePropertyTypeRule } from "../../ruleRuntime"
import { orderAndPersistNamedChildren } from "../omittedChildren"

/** Экспортирует список имён форм с сохранённым порядком актуальных элементов. */
export const exportChildFormNamesToXML: ExportToXMLFunctionNew = (params): string[] | undefined => {
  const { context, value } = params
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

  return orderAndPersistNamedChildren({ xmlName: "Form", names, saved, runtime })
}

export const metadataPropertyRule000 = definePropertyTypeRule("ChildFormNames", "exportToXML", exportChildFormNamesToXML)
