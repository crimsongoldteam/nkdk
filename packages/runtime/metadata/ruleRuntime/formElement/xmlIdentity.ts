import type { ConfigurationContextWithExportToXML } from "../../context/types"

export function resolveFormElementXMLId(context: ConfigurationContextWithExportToXML): string | undefined {
  const runtime = context.exportToXML.configurationIndex
  const indexedId = runtime?.identity("xmlId")
  if (indexedId !== undefined) runtime?.collector.setIdentity(runtime.logicalAddress, "xmlId", indexedId)
  return indexedId
}
