import { ExportToXMLFunctionNew, registerTypeRule } from "../../orchestration"

/** Экспортирует список имён форм.
 * Приоритет: сначала referenceData (round-trip), затем context.forms (IO-путь).
 */
export const exportChildFormNamesToXML: ExportToXMLFunctionNew = (params): string[] | undefined => {
  const { context, value } = params
  if (Array.isArray(value) && value.length > 0) return value as string[]
  const contextForms = context.exportToXML.context?.forms
  if (contextForms && contextForms.length > 0) return contextForms
  return undefined
}

registerTypeRule("ChildFormNames", "exportToXML", exportChildFormNamesToXML)
