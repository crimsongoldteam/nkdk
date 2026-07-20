import type { ConfigurationContextWithExportToXML } from "../context/types"

export function getConfigurationIndexPropertyOrder(
  context: ConfigurationContextWithExportToXML | undefined
): readonly string[] {
  return context?.exportToXML.configurationIndex?.xmlNode()?.order ?? []
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
