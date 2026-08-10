import { ExportToXMLFunctionNew, definePropertyTypeRule } from "../../ruleRuntime"
import { mergeOmittedNames, readOmittedNames } from "../omittedChildren"
import { setChildTemplateNamesOmittedChildren } from "./fromXML"

const PROPERTY_TYPE = "ChildTemplateNames"

/** Экспортирует список имён макетов с сохранённым порядком актуальных элементов. */
export const exportChildTemplateNamesToXML: ExportToXMLFunctionNew = (params): string[] | undefined => {
  const { context, value } = params
  const runtime = context.exportToXML.configurationIndex
  const saved = runtime?.omittedChildren()
  readOmittedNames(saved, PROPERTY_TYPE)

  const names =
    Array.isArray(value) && value.length > 0
      ? value.filter((name): name is string => typeof name === "string")
      : context.exportToXML.context?.templates
  if (names === undefined || names.length === 0) return undefined

  const ordered = mergeOmittedNames(names, saved)
  if (runtime !== undefined) {
    setChildTemplateNamesOmittedChildren(
      runtime.collector,
      runtime.xmlNodeLogicalAddress ?? runtime.logicalAddress,
      ordered
    )
  }
  return ordered
}

export const metadataPropertyRule000 = definePropertyTypeRule("ChildTemplateNames", "exportToXML", exportChildTemplateNamesToXML)
