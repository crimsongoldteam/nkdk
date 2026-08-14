import { ExportToXMLFunctionNew, definePropertyTypeRule } from "../../ruleRuntime"
import { orderAndPersistNamedChildren } from "../omittedChildren"

/** Экспортирует список имён макетов с сохранённым порядком актуальных элементов. */
export const exportChildTemplateNamesToXML: ExportToXMLFunctionNew = (params): string[] | undefined => {
  const { context, value } = params
  const runtime = context.exportToXML.configurationIndex
  const saved = runtime?.children()

  const names =
    Array.isArray(value) && value.length > 0
      ? value.filter((name): name is string => typeof name === "string")
      : context.exportToXML.context?.templates
  if (names === undefined || names.length === 0) return undefined

  return orderAndPersistNamedChildren({ xmlName: "Template", names, saved, runtime })
}

export const metadataPropertyRule000 = definePropertyTypeRule("ChildTemplateNames", "exportToXML", exportChildTemplateNamesToXML)
