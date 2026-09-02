import type { ConfigurationContextWithExportToXML } from "../../context/types"

export function resolveFormElementXMLId(context: ConfigurationContextWithExportToXML): string | undefined {
  const runtime = context.exportToXML.configurationIndex
  return runtime?.identity("xmlId")
}
