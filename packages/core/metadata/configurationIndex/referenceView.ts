import type { ConfigurationContextWithExportToXML } from "../context/types"
import type { ConfigurationIndexAddressingMode } from "../orchestration/property/types"
import type { OmittedChildren } from "./types"
import { childSegmentUid, childUid, yamlIndexUid, yamlKeyUid } from "./logicalAddress"

export function getConfigurationIndexXmlName(
  context: ConfigurationContextWithExportToXML | undefined
): string | undefined {
  return context?.exportToXML.configurationIndex?.identity("xmlName")
}

export function getConfigurationIndexXmlNodeLogicalAddress(
  context: ConfigurationContextWithExportToXML
): string | undefined {
  const runtime = context.exportToXML.configurationIndex
  if (runtime === undefined) return undefined
  return runtime.xmlNodeLogicalAddress ?? runtime.logicalAddress
}

export function getConfigurationIndexOmittedChildren(
  context: ConfigurationContextWithExportToXML | undefined
): OmittedChildren | undefined {
  return context?.exportToXML.configurationIndex?.omittedChildren()
}

export function getConfigurationIndexPropertyXmlValue(
  context: ConfigurationContextWithExportToXML | undefined,
  propertyKey: string
) {
  const runtime = context?.exportToXML.configurationIndex
  if (runtime === undefined) return undefined
  return runtime.xml(`${runtime.logicalAddress}.${propertyKey}`)
}

export function getConfigurationIndexPropertyReferenceXMLValue(
  context: ConfigurationContextWithExportToXML | undefined,
  propertyKey: string
): unknown {
  const value = getConfigurationIndexPropertyXmlValue(context, propertyKey)
  if (value === undefined) return undefined
  if (value.xsiNil === true) return { "_xsi:nil": true }
  if (
    value.xsiType !== undefined ||
    value.xmlText !== undefined ||
    value.xmlPrefix !== undefined ||
    value.explicitEmpty === true
  ) {
    return {
      ...(value.xsiType === undefined ? {} : { "_xsi:type": value.xsiType }),
      ...(value.xmlPrefix === undefined ? {} : { _xmlns: value.xmlPrefix }),
      ...(value.xmlText === undefined ? {} : { "#text": value.xmlText }),
    }
  }
  return undefined
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

export function withConfigurationIndexExportYamlCollectionItemContext(
  context: ConfigurationContextWithExportToXML,
  params: { index: number; yamlKey?: string; yamlAsArray?: true }
): ConfigurationContextWithExportToXML {
  const runtime = context.exportToXML.configurationIndex
  if (runtime === undefined || runtime.yamlPathAddressing !== true) return context
  return withConfigurationIndexExportLogicalAddress(
    context,
    params.yamlAsArray === true || params.yamlKey === undefined
      ? yamlIndexUid(runtime.logicalAddress, params.index)
      : yamlKeyUid(runtime.logicalAddress, params.yamlKey)
  )
}

export function withConfigurationIndexExportXmlNodeLogicalAddress(
  context: ConfigurationContextWithExportToXML,
  xmlNodeLogicalAddress: string
): ConfigurationContextWithExportToXML {
  const runtime = context.exportToXML.configurationIndex
  if (runtime === undefined) return context
  return {
    ...context,
    exportToXML: {
      ...context.exportToXML,
      configurationIndex: runtime.withXmlNodeLogicalAddress(xmlNodeLogicalAddress),
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
