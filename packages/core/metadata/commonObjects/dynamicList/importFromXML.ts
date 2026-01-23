import { ConfigurationContext } from "~/metadata/context/types"
import { DynamicList, DynamicListXML } from "./types"

export const importDynamicListFromXML = (
  _context: ConfigurationContext,
  xml: DynamicListXML | undefined
): DynamicList | undefined => {
  if (!xml) return undefined

  // Get xsi:type from @attributes or _xsi:type (parser can add both)
  const xsiType = xml["@attributes"]?.["xsi:type"] ?? (xml as any)["_xsi:type"] ?? "DynamicList"

  const result: DynamicList = {
    Settings: {
      "@attributes": {
        "xsi:type": xsiType,
      },
    },
  }

  if (xml.ManualQuery !== undefined) {
    result.Settings.ManualQuery = xml.ManualQuery
  }

  if (xml.DynamicDataRead !== undefined) {
    result.Settings.DynamicDataRead = xml.DynamicDataRead
  }

  if (xml.Parameter !== undefined) {
    const parameters = Array.isArray(xml.Parameter) ? xml.Parameter : [xml.Parameter]
    result.Settings.Parameter = parameters
  }

  if (xml.MainTable !== undefined) {
    result.Settings.MainTable = xml.MainTable
  }

  if (xml.ListSettings !== undefined) {
    result.Settings.ListSettings = xml.ListSettings
  }

  // Copy any additional properties (excluding parser-added attributes)
  Object.keys(xml).forEach((key) => {
    if (
      ![
        "@attributes",
        "_xsi:type",
        "ManualQuery",
        "DynamicDataRead",
        "Parameter",
        "MainTable",
        "ListSettings",
      ].includes(key)
    ) {
      result.Settings[key] = xml[key]
    }
  })

  return result
}
