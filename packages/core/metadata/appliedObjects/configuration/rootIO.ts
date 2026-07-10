import fs from "fs"
import { join } from "path"
import {
  exportMetadataItemToXML,
  exportMetadataItemToYAML,
  importMetadataItemFromXML,
  importMetadataItemFromYAML,
} from "../../orchestration"
import {
  ConfigurationContext,
  ConfigurationContextFromXML,
  ConfigurationContextWithExportToXML,
} from "../../context/types"
import { getTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { importPropertyFromXML } from "../../orchestration/property/fromXML"
import type { PropertyRule } from "../../orchestration/property/types"
import { importContentFromXML } from "../../../xml/import/importer"
import { xmlExport } from "../../../xml/export/exporter"
import { exportToYAML } from "../../../yaml/export"
import { importFromYAML } from "../../../yaml/import"
import { CONFIGURATION_YAML_FILE } from "../../project/constants"
import { MetadataConfigurationRules } from "./rules"
import type { MetadataConfiguration, MetadataConfigurationYAML } from "./types"
import type { ConfigurationChildObjectsXML } from "./childObjects"

export const CONFIGURATION_XML_FILE = "Configuration.xml"
export { CONFIGURATION_YAML_FILE }

type MetadataConfigurationXMLObject = {
  MetaDataObject?: {
    Configuration?: Record<string, unknown>
  }
}

const setConfigurationChildObjectsXML = (
  xmlObject: Record<string, unknown>,
  childObjects: ConfigurationChildObjectsXML
): void => {
  const root = (xmlObject as MetadataConfigurationXMLObject).MetaDataObject?.Configuration
  if (root !== undefined) {
    root.ChildObjects = childObjects
  }
}

export const readConfigurationFromXML = (params: {
  context: ConfigurationContextFromXML
  inputDir: string
}): MetadataConfiguration | undefined => {
  const source = fs.readFileSync(join(params.inputDir, CONFIGURATION_XML_FILE), "utf-8")
  const parsed = importContentFromXML<{ MetaDataObject: unknown }>(source)

  const configuration = importMetadataItemFromXML({
    context: params.context,
    rule: MetadataConfigurationRules,
    xml: parsed.MetaDataObject,
  }) as MetadataConfiguration | undefined

  readConfigurationFilePathPropertiesFromXML({
    context: params.context,
    inputDir: params.inputDir,
    configuration,
  })

  return configuration
}

export const writeConfigurationToYAML = (params: {
  context: ConfigurationContext
  configuration: MetadataConfiguration | undefined
  outputDir: string
}): void => {
  const yamlObject = exportMetadataItemToYAML({
    context: params.context,
    data: params.configuration,
    rule: MetadataConfigurationRules,
  })
  const yaml = yamlObject === undefined ? "" : exportToYAML(yamlObject)

  fs.mkdirSync(params.outputDir, { recursive: true })
  fs.writeFileSync(join(params.outputDir, CONFIGURATION_YAML_FILE), yaml, "utf-8")
}

export const readConfigurationFromYAML = (params: {
  context: ConfigurationContext
  inputDir: string
  source?: MetadataConfiguration
}): MetadataConfiguration | undefined => {
  const yaml = fs.readFileSync(join(params.inputDir, CONFIGURATION_YAML_FILE), "utf-8")
  const yamlObject = importFromYAML<MetadataConfigurationYAML>(yaml)

  return importMetadataItemFromYAML({
    context: params.context,
    yaml: yamlObject,
    source: filterFilePathSourceForYAMLImport({ yaml: yamlObject, source: params.source }),
    rule: MetadataConfigurationRules,
    name: typeof yamlObject?.Имя === "string" ? yamlObject.Имя : undefined,
  }) as MetadataConfiguration | undefined
}

export const writeConfigurationToXML = (params: {
  context: ConfigurationContextWithExportToXML
  configuration: MetadataConfiguration | undefined
  outputDir: string
  referenceConfiguration?: MetadataConfiguration
  childObjects?: ConfigurationChildObjectsXML
}): void => {
  const xmlObject = exportMetadataItemToXML({
    context: params.context,
    data: params.configuration,
    referenceData: params.referenceConfiguration,
    rule: MetadataConfigurationRules,
  })
  if (xmlObject === undefined) return
  if (params.childObjects !== undefined) {
    setConfigurationChildObjectsXML(xmlObject, params.childObjects)
  }

  fs.mkdirSync(params.outputDir, { recursive: true })
  fs.writeFileSync(join(params.outputDir, CONFIGURATION_XML_FILE), xmlExport(xmlObject), "utf-8")
}

const readConfigurationFilePathPropertiesFromXML = (params: {
  context: ConfigurationContextFromXML
  inputDir: string
  configuration: MetadataConfiguration | undefined
}): void => {
  if (params.configuration === undefined) return

  for (const [key, propRule] of Object.entries(MetadataConfigurationRules.properties) as [string, PropertyRule][]) {
    if (propRule.filePath === undefined) continue
    if (!getTypeRule(propRule.type, "importFromXML")) continue
    const extFilePath = join(params.inputDir, propRule.filePath)
    if (!fs.existsSync(extFilePath)) continue
    const extContent = fs.readFileSync(extFilePath, "utf-8")
    const extParsed = importContentFromXML<Record<string, unknown>>(extContent)
    const value = importPropertyFromXML({
      context: params.context,
      rule: propRule,
      value: extParsed,
      name: key,
    })
    if (value !== undefined) (params.configuration as Record<string, unknown>)[key] = value
  }
}

const filterFilePathSourceForYAMLImport = (params: {
  yaml: MetadataConfigurationYAML | undefined
  source: MetadataConfiguration | undefined
}): MetadataConfiguration | undefined => {
  if (params.source === undefined) return undefined

  const result = { ...params.source } as Record<string, unknown>
  for (const [key, propRule] of Object.entries(MetadataConfigurationRules.properties) as [string, PropertyRule][]) {
    if (propRule.filePath === undefined) continue
    const yamlKey = propRule.yaml as keyof MetadataConfigurationYAML | undefined
    const hasYAMLValue =
      params.yaml !== undefined && yamlKey !== undefined && Object.prototype.hasOwnProperty.call(params.yaml, yamlKey)
    if (!hasYAMLValue && propRule.exportReferenceFileOnMissingValue !== true) {
      delete result[key]
    }
  }

  return result as MetadataConfiguration
}
