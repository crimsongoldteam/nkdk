import { ExportToXMLFunctionNew, registerTypeRule } from "../../orchestration"
import { mergeOmittedNames, readOmittedNames } from "../omittedChildren"
import { setChildFormNamesOmittedChildren } from "./fromXML"

const PROPERTY_TYPE = "ChildFormNames"

/** Экспортирует список имён форм с сохранённым порядком актуальных элементов. */
export const exportChildFormNamesToXML: ExportToXMLFunctionNew = (params): string[] | undefined => {
  const { context, value, referenceMetadata } = params
  const runtime = context.exportToXML.configurationIndex
  const saved = runtime?.omittedChildren()
  readOmittedNames(saved, PROPERTY_TYPE)

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
  const ordered = mergeOmittedNames(
    names,
    saved ?? (referenceNames === undefined ? undefined : { kind: "names", names: referenceNames })
  )
  if (runtime !== undefined) {
    setChildFormNamesOmittedChildren(
      runtime.collector,
      runtime.xmlNodeLogicalAddress ?? runtime.logicalAddress,
      ordered
    )
  }
  return ordered
}

registerTypeRule("ChildFormNames", "exportToXML", exportChildFormNamesToXML)
