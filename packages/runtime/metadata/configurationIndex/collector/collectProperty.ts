import type { ConfigurationContextFromXML } from "../../context/types"
import type { ConfigurationIndexValueFromXMLDescriptor } from "../../ruleRuntime/property/fn"
import { getConfigurationIndexCollectionContext } from "./context"

export function collectConfigurationIndexIdentityFromXML(params: {
  context: ConfigurationContextFromXML
  sourceXmlKey: string | undefined
  xmlValue: unknown
  reconstructibleXmlName?: string
  descriptor?: ConfigurationIndexValueFromXMLDescriptor
}): void {
  const collection = getConfigurationIndexCollectionContext(params.context)
  if (collection === undefined || typeof params.xmlValue !== "string") return

  if (params.sourceXmlKey === "_uuid") {
    collection.collector.setIdentity(collection.logicalAddress, "uuid", params.xmlValue)
    return
  }
  if (params.sourceXmlKey === "_id") {
    if (params.descriptor?.identityKind === "uuid") {
      collection.collector.setIdentity(collection.logicalAddress, "uuid", params.xmlValue)
    } else {
      collection.collector.setIdentity(collection.logicalAddress, "xmlId", params.xmlValue)
    }
    return
  }
}
