import type { ConfigurationContextFromXML } from "../../context/types"
import type { ConfigurationIndexCollector } from "./writer"

export interface ConfigurationIndexCollectionContext {
  readonly collector: ConfigurationIndexCollector
  readonly logicalAddress: string
  readonly xmlNodeLogicalAddress?: string
  readonly childCollectionUidSegment?: string
}

export function withConfigurationIndexCollector(
  context: ConfigurationContextFromXML,
  collector: ConfigurationIndexCollector,
  logicalAddress: string
): ConfigurationContextFromXML {
  return {
    ...context,
    fromXML: {
      ...context.fromXML,
      configurationIndex: { collector, logicalAddress },
    },
  }
}

export function getConfigurationIndexCollectionContext(
  context: ConfigurationContextFromXML
): ConfigurationIndexCollectionContext | undefined {
  return context.fromXML.configurationIndex
}

export function withConfigurationIndexLogicalAddress(
  context: ConfigurationContextFromXML,
  logicalAddress: string
): ConfigurationContextFromXML {
  const collection = getConfigurationIndexCollectionContext(context)
  return collection === undefined
    ? context
    : withConfigurationIndexCollector(context, collection.collector, logicalAddress)
}

export function withConfigurationIndexXmlNodeLogicalAddress(
  context: ConfigurationContextFromXML,
  xmlNodeLogicalAddress: string
): ConfigurationContextFromXML {
  const collection = getConfigurationIndexCollectionContext(context)
  if (collection === undefined) return context

  return {
    ...context,
    fromXML: {
      ...context.fromXML,
      configurationIndex: { ...collection, xmlNodeLogicalAddress },
    },
  }
}

export function getConfigurationIndexXmlNodeLogicalAddress(collection: ConfigurationIndexCollectionContext): string {
  return collection.xmlNodeLogicalAddress ?? collection.logicalAddress
}

export function withConfigurationIndexChildCollection(
  context: ConfigurationContextFromXML,
  uidSegment: string
): ConfigurationContextFromXML {
  const collection = getConfigurationIndexCollectionContext(context)
  if (collection === undefined) return context

  return {
    ...context,
    fromXML: {
      ...context.fromXML,
      configurationIndex: { ...collection, childCollectionUidSegment: uidSegment },
    },
  }
}
