import { ExportToXMLFunctionNew, registerTypeRule } from "../../orchestration"
import { getConfigurationIndexPropertyOrder } from "../../configurationIndex/referenceView"

/** Экспортирует список имён макетов.
 * Приоритет: сначала referenceData (round-trip), затем context.templates (IO-путь).
 */
export const exportChildTemplateNamesToXML: ExportToXMLFunctionNew = (params): string[] | undefined => {
  const { context, value } = params
  if (Array.isArray(value) && value.length > 0) return value as string[]
  const contextTemplates = context.exportToXML.context?.templates
  if (contextTemplates && contextTemplates.length > 0) return contextTemplates
  const indexedTemplates = getConfigurationIndexPropertyOrder(context)
    .filter((name): name is string => typeof name === "string")
  return indexedTemplates.length > 0 ? [...indexedTemplates] : undefined
}

registerTypeRule("ChildTemplateNames", "exportToXML", exportChildTemplateNamesToXML)
