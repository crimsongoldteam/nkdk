import { ExportToXMLFunctionNew, registerTypeRule } from "~/metadata/orchestration"

export const exportChildFileItemNamesToXML: ExportToXMLFunctionNew = (params): string[] | undefined => {
  const { value } = params
  if (!Array.isArray(value)) return undefined
  const names = value.filter((item): item is string => typeof item === "string")
  return names.length > 0 ? names : undefined
}

registerTypeRule("ChildFileItemNames", "exportToXML", exportChildFileItemNamesToXML)
