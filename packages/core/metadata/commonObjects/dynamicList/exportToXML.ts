import { ConfigurationContext } from "~/metadata/context/types"
import { DynamicList, DynamicListXML } from "./types"

export const exportDynamicListToXML = (
  _context: ConfigurationContext,
  data: DynamicList | undefined
): DynamicListXML | undefined => {
  if (!data || !data.Settings) return undefined

  const settings = data.Settings
  const result: DynamicListXML = {}

  if (settings["@attributes"]?.["xsi:type"]) {
    result["@attributes"] = {
      "xsi:type": settings["@attributes"]["xsi:type"],
    }
  }

  if (settings.ManualQuery !== undefined) {
    result.ManualQuery = settings.ManualQuery
  }

  if (settings.DynamicDataRead !== undefined) {
    result.DynamicDataRead = settings.DynamicDataRead
  }

  if (settings.Parameter !== undefined) {
    result.Parameter = settings.Parameter
  }

  if (settings.MainTable !== undefined) {
    result.MainTable = settings.MainTable
  }

  if (settings.ListSettings !== undefined) {
    result.ListSettings = settings.ListSettings
  }

  // Copy any additional properties
  Object.keys(settings).forEach((key) => {
    if (
      !["@attributes", "ManualQuery", "DynamicDataRead", "Parameter", "MainTable", "ListSettings"].includes(key)
    ) {
      result[key] = settings[key]
    }
  })

  return result
}
