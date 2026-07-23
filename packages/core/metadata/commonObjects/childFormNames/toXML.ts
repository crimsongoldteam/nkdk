import { ExportToXMLFunctionNew, registerTypeRule } from "../../orchestration"

/** Экспортирует список имён форм.
 * Приоритет: сначала referenceData (round-trip), затем context.forms (IO-путь).
 */
export const exportChildFormNamesToXML: ExportToXMLFunctionNew = (params): string[] | undefined => {
  const { context, value, referenceMetadata } = params
  if (Array.isArray(value) && value.length > 0) {
    const names = value as string[]
    if (!Array.isArray(referenceMetadata)) return names
    const current = new Set(names)
    const preserved = referenceMetadata.filter((name): name is string => typeof name === "string" && current.has(name))
    const preservedSet = new Set(preserved)
    return [...preserved, ...names.filter((name) => !preservedSet.has(name))]
  }
  const contextForms = context.exportToXML.context?.forms
  if (contextForms && contextForms.length > 0) return contextForms
  return undefined
}

registerTypeRule("ChildFormNames", "exportToXML", exportChildFormNamesToXML)
