import { ExportToXMLFunctionNew, definePropertyTypeRule } from "../../ruleRuntime"
import { orderAndPersistNamedChildren } from "../omittedChildren"

export const exportChildFileItemNamesToXML: ExportToXMLFunctionNew = (params): string[] | undefined => {
  const { value } = params
  const runtime = params.context.exportToXML.configurationIndex
  const saved = runtime?.children()

  if (!Array.isArray(value)) return undefined
  const names = value.filter((item): item is string => typeof item === "string")
  if (names.length === 0) return undefined

  const xmlName = params.rule.xml ?? saved?.[0]?.xmlName ?? "Table"
  return orderAndPersistNamedChildren({ xmlName, names, saved, runtime })
}

export const metadataPropertyRule000 = definePropertyTypeRule("ChildFileItemNames", "exportToXML", exportChildFileItemNamesToXML)
