import type { ConfigurationContextFromXML } from "../../context/types"
import type { ConfigurationIndexAddressingMode } from "../../orchestration/property/types"
import { childSegmentUid, childUid, yamlIndexUid, yamlKeyUid, yamlPropertyUid } from "../logicalAddress"
import type { ConfigurationIndexCollector } from "./writer"

export interface ConfigurationIndexCollectionContext {
  readonly collector: ConfigurationIndexCollector
  readonly logicalAddress: string
  readonly xmlNodeLogicalAddress?: string
  readonly formElementRootLogicalAddress?: string
  readonly childCollectionUidSegment?: string
  readonly yamlPathAddressing?: true
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
  if (collection === undefined) return context
  const { xmlNodeLogicalAddress: _xmlNodeLogicalAddress, ...nextCollection } = collection

  return {
    ...context,
    fromXML: {
      ...context.fromXML,
      configurationIndex: { ...nextCollection, logicalAddress },
    },
  }
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

export function withConfigurationIndexFormElementRootLogicalAddress(
  context: ConfigurationContextFromXML,
  formElementRootLogicalAddress: string
): ConfigurationContextFromXML {
  const collection = getConfigurationIndexCollectionContext(context)
  if (collection === undefined) return context

  return {
    ...context,
    fromXML: {
      ...context.fromXML,
      configurationIndex: { ...collection, formElementRootLogicalAddress },
    },
  }
}

export function getConfigurationIndexFormElementLogicalAddress(
  collection: ConfigurationIndexCollectionContext,
  elementName: string
): string {
  return childUid(collection.formElementRootLogicalAddress ?? collection.logicalAddress, "Элемент", elementName)
}

export function getConfigurationIndexFormSingletonLogicalAddress(
  collection: ConfigurationIndexCollectionContext,
  singletonSegment: string
): string {
  return childSegmentUid(collection.logicalAddress, singletonSegment)
}

export function runWithConfigurationIndexPropertyContext<T>(
  context: ConfigurationContextFromXML,
  propertyName: string,
  childCollectionUidSegment: string | undefined,
  run: (context: ConfigurationContextFromXML) => T,
  options: { configurationIndexAddressing?: ConfigurationIndexAddressingMode } = {}
): T {
  const collection = getConfigurationIndexCollectionContext(context)
  if (collection === undefined) return run(context)

  const previous = context.fromXML.configurationIndex
  const useYamlPath = collection.yamlPathAddressing === true || options.configurationIndexAddressing === "yamlPath"
  const propertyAddress = getConfigurationIndexPropertyLogicalAddress(
    collection,
    propertyName,
    options.configurationIndexAddressing
  )
  context.fromXML.configurationIndex = {
    ...collection,
    ...(useYamlPath ? { logicalAddress: propertyAddress } : {}),
    xmlNodeLogicalAddress: propertyAddress,
    ...(useYamlPath ? { yamlPathAddressing: true as const } : {}),
    ...(childCollectionUidSegment === undefined ? {} : { childCollectionUidSegment }),
  }
  try {
    return run(context)
  } finally {
    context.fromXML.configurationIndex = previous
  }
}

export function getConfigurationIndexPropertyLogicalAddress(
  collection: ConfigurationIndexCollectionContext,
  propertyName: string,
  mode: ConfigurationIndexAddressingMode | undefined
): string {
  const useYamlPath = collection.yamlPathAddressing === true || mode === "yamlPath"
  return useYamlPath
    ? yamlPropertyUid(collection.logicalAddress, propertyName)
    : childUid(collection.logicalAddress, "Свойство", propertyName)
}

export function withConfigurationIndexYamlCollectionItemContext(
  context: ConfigurationContextFromXML,
  params: { index: number; yamlKey?: string; yamlAsArray?: true }
): ConfigurationContextFromXML {
  const collection = getConfigurationIndexCollectionContext(context)
  if (collection === undefined || collection.yamlPathAddressing !== true) return context

  return withConfigurationIndexLogicalAddress(
    context,
    params.yamlAsArray === true || params.yamlKey === undefined
      ? yamlIndexUid(collection.logicalAddress, params.index)
      : yamlKeyUid(collection.logicalAddress, params.yamlKey)
  )
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
