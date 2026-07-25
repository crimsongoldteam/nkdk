import { ExportToXMLFunctionNew, registerTypeRule } from "../../orchestration"

export const exportChildFileItemNamesToXML: ExportToXMLFunctionNew = (params): string[] | undefined => {
  const { value } = params
  if (!Array.isArray(value)) return undefined
  const names = value.filter((item): item is string => typeof item === "string")
  if (names.length === 0) return undefined

  const runtime = params.context.exportToXML.configurationIndex
  const sourceOrder = runtime?.xmlNode()?.order ?? []
  const sourceIndex = new Map(sourceOrder.map((name, index) => [name, index]))
  const ordered = [...names].sort((left, right) => {
    const leftIndex = sourceIndex.get(left)
    const rightIndex = sourceIndex.get(right)
    if (leftIndex === undefined && rightIndex === undefined) return 0
    if (leftIndex === undefined) return 1
    if (rightIndex === undefined) return -1
    return leftIndex - rightIndex
  })
  if (runtime !== undefined) {
    runtime.collector.setOrder(runtime.xmlNodeLogicalAddress ?? runtime.logicalAddress, ordered)
  }
  return ordered
}

registerTypeRule("ChildFileItemNames", "exportToXML", exportChildFileItemNamesToXML)
