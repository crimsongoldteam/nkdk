import { ExportToXMLFunctionNew, registerTypeRule } from "../../orchestration"
import { mergeOmittedNames, readOmittedNames } from "../omittedChildren"
import { setChildFileItemNamesOmittedChildren } from "./fromXML"

export const exportChildFileItemNamesToXML: ExportToXMLFunctionNew = (params): string[] | undefined => {
  const { value } = params
  const runtime = params.context.exportToXML.configurationIndex
  const saved = runtime?.omittedChildren()
  readOmittedNames(saved, "ChildFileItemNames")

  if (!Array.isArray(value)) return undefined
  const names = value.filter((item): item is string => typeof item === "string")
  if (names.length === 0) return undefined

  const ordered = mergeOmittedNames(names, saved)
  if (runtime !== undefined) {
    setChildFileItemNamesOmittedChildren(
      runtime.collector,
      runtime.xmlNodeLogicalAddress ?? runtime.logicalAddress,
      ordered
    )
  }
  return ordered
}

registerTypeRule("ChildFileItemNames", "exportToXML", exportChildFileItemNamesToXML)
