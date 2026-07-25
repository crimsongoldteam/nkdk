import { ExportToXMLFunctionNew, registerTypeRule } from "../../orchestration"
import { getConfigurationIndexPropertyOrder } from "../../configurationIndex/referenceView"

/** Экспортирует список имён форм.
 * Приоритет: сначала referenceData (round-trip), затем context.forms (IO-путь).
 */
export const exportChildFormNamesToXML: ExportToXMLFunctionNew = (params): string[] | undefined => {
  const { context, value, referenceMetadata } = params
  if (Array.isArray(value) && value.length > 0) {
    const names = value as string[]
    return preserveAndCollectOrder(
      context,
      names,
      Array.isArray(referenceMetadata) ? referenceMetadata : getConfigurationIndexPropertyOrder(context)
    )
  }
  const contextForms = context.exportToXML.context?.forms
  if (contextForms && contextForms.length > 0) {
    return preserveAndCollectOrder(context, contextForms, getConfigurationIndexPropertyOrder(context))
  }
  return undefined
}

registerTypeRule("ChildFormNames", "exportToXML", exportChildFormNamesToXML)

function preserveAndCollectOrder(
  context: Parameters<ExportToXMLFunctionNew>[0]["context"],
  names: readonly string[],
  sourceOrder: readonly unknown[]
): string[] {
  const current = new Set(names)
  const preserved = sourceOrder.filter((name): name is string => typeof name === "string" && current.has(name))
  const preservedSet = new Set(preserved)
  const ordered = [...preserved, ...names.filter((name) => !preservedSet.has(name))]
  const runtime = context.exportToXML.configurationIndex
  if (runtime !== undefined) {
    runtime.collector.setOrder(runtime.xmlNodeLogicalAddress ?? runtime.logicalAddress, ordered)
  }
  return ordered
}
