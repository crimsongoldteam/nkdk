import type { ConfigurationContextWithExportToXML } from "../context/types"
import type { ConfigurationIndexAddressingMode } from "../orchestration/property/types"
import { childSegmentUid, childUid } from "./logicalAddress"

export function getConfigurationIndexPropertyOrder(
  context: ConfigurationContextWithExportToXML | undefined
): readonly string[] {
  return context?.exportToXML.configurationIndex?.xmlNode()?.order ?? []
}

export function getConfigurationIndexXmlNodeLogicalAddress(context: ConfigurationContextWithExportToXML): string | undefined {
  const runtime = context.exportToXML.configurationIndex
  if (runtime === undefined) return undefined
  return runtime.xmlNodeLogicalAddress ?? runtime.logicalAddress
}

export function getConfigurationIndexSourceXmlKey(
  context: ConfigurationContextWithExportToXML,
  propertyKey: string
): string | undefined {
  return context.exportToXML.configurationIndex?.xmlNode()?.aliases?.[propertyKey]
}

export function isConfigurationIndexPropertyPresent(
  context: ConfigurationContextWithExportToXML | undefined,
  propertyKey: string
): boolean {
  return context?.exportToXML.configurationIndex?.xmlNode()?.present?.includes(propertyKey) === true
}

export function getConfigurationIndexPropertyXmlValue(
  context: ConfigurationContextWithExportToXML | undefined,
  propertyKey: string
) {
  const runtime = context?.exportToXML.configurationIndex
  if (runtime === undefined) return undefined
  return runtime.xmlValue(`${runtime.logicalAddress}.${propertyKey}`)
}

export function withConfigurationIndexExportLogicalAddress(
  context: ConfigurationContextWithExportToXML,
  logicalAddress: string
): ConfigurationContextWithExportToXML {
  const runtime = context.exportToXML.configurationIndex
  if (runtime === undefined) return context
  return {
    ...context,
    exportToXML: {
      ...context.exportToXML,
      configurationIndex: runtime.withLogicalAddress(logicalAddress),
    },
  }
}

export function withConfigurationIndexExportFormElementRootLogicalAddress(
  context: ConfigurationContextWithExportToXML,
  logicalAddress: string
): ConfigurationContextWithExportToXML {
  const runtime = context.exportToXML.configurationIndex
  if (runtime === undefined) return context
  return {
    ...context,
    exportToXML: {
      ...context.exportToXML,
      configurationIndex: runtime.withFormElementRootLogicalAddress(logicalAddress),
    },
  }
}

export function configurationIndexExportFormElementLogicalAddress(
  context: ConfigurationContextWithExportToXML,
  elementName: string
): string | undefined {
  const runtime = context.exportToXML.configurationIndex
  if (runtime === undefined) return undefined
  return childUid(runtime.formElementRootLogicalAddress ?? runtime.logicalAddress, "Элемент", elementName)
}

export function configurationIndexExportFormSingletonLogicalAddress(
  context: ConfigurationContextWithExportToXML,
  singletonSegment: string
): string | undefined {
  const runtime = context.exportToXML.configurationIndex
  if (runtime === undefined) return undefined
  return childSegmentUid(runtime.logicalAddress, singletonSegment)
}

export function withConfigurationIndexExportPropertyContext(
  context: ConfigurationContextWithExportToXML,
  propertyName: string,
  childCollectionUidSegment: string | undefined,
  options: { configurationIndexAddressing?: ConfigurationIndexAddressingMode } = {}
): ConfigurationContextWithExportToXML {
  const runtime = context.exportToXML.configurationIndex
  if (runtime === undefined) return context
  return {
    ...context,
    exportToXML: {
      ...context.exportToXML,
      configurationIndex: runtime.withPropertyContext(propertyName, childCollectionUidSegment, options),
    },
  }
}
