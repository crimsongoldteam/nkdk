import type { ConfigurationContextFromXML } from "../../context/types"
import type { ConfigurationIndexCollector } from "./writer"

export interface ConfigurationIndexCollectionContext {
  readonly collector: ConfigurationIndexCollector
  readonly logicalAddress: string
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
