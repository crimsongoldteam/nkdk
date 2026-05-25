import fs from "fs"
import { join } from "path"
import {
  exportMetadataItemToXML,
  exportMetadataItemToYAML,
  importMetadataItemFromXML,
  importMetadataItemFromYAML,
} from "~/metadata/orchestration"
import { ConfigurationContext, ConfigurationContextFromXML, ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { importContentFromXML } from "~/xml/import/importer"
import { xmlExport } from "~/xml/export/exporter"
import { exportToYAML } from "~/yaml/export"
import { importFromYAML } from "~/yaml/import"
import { MetadataConfigurationRules } from "./rules"
import type { MetadataConfiguration, MetadataConfigurationYAML } from "./types"

export const CONFIGURATION_XML_FILE = "Configuration.xml"
export const CONFIGURATION_YAML_FILE = "Конфигурация.yaml"

export const readConfigurationFromXML = (params: {
  context: ConfigurationContextFromXML
  inputDir: string
}): MetadataConfiguration | undefined => {
  const source = fs.readFileSync(join(params.inputDir, CONFIGURATION_XML_FILE), "utf-8")
  const parsed = importContentFromXML<{ MetaDataObject: unknown }>(source)

  return importMetadataItemFromXML({
    context: params.context,
    rule: MetadataConfigurationRules,
    xml: parsed.MetaDataObject,
  }) as MetadataConfiguration | undefined
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
    source: params.source,
    rule: MetadataConfigurationRules,
  }) as MetadataConfiguration | undefined
}

export const writeConfigurationToXML = (params: {
  context: ConfigurationContextWithExportToXML
  configuration: MetadataConfiguration | undefined
  outputDir: string
  referenceConfiguration?: MetadataConfiguration
}): void => {
  const xmlObject = exportMetadataItemToXML({
    context: params.context,
    data: params.configuration,
    referenceData: params.referenceConfiguration,
    rule: MetadataConfigurationRules,
  })
  if (xmlObject === undefined) return

  fs.mkdirSync(params.outputDir, { recursive: true })
  fs.writeFileSync(join(params.outputDir, CONFIGURATION_XML_FILE), xmlExport(xmlObject), "utf-8")
}
