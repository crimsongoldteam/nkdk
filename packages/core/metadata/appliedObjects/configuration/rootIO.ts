import fs from "fs"
import { join } from "path"
import { ConfigurationContextWithExportToXML } from "../../context/types"
import { importContentFromXML } from "../../../xml/import/importer"
import { xmlExport } from "../../../xml/export/exporter"
import { CONFIGURATION_YAML_FILE } from "../../project/constants"
import type { PreparedYamlFile } from "../../project/preparedYamlProject"
import { MetadataConfigurationRules } from "./rules"
import type { MetadataConfigurationYAML } from "./types"
import type { ConfigurationChildObjectsXML } from "./childObjects"
import { convertMetadataItemFromYAMLToXML } from "../../orchestration/metadataItem/fromYAMLToXML"
import type {
  YAMLToXMLExternalWrite,
  YAMLToXMLExternalWriteFactory,
  YAMLToXMLProfile,
} from "../../orchestration/property/fromYAMLToXMLTypes"
import { bindDeferredObjectValues, type DeferredObjectValue } from "../../orchestration/property/deferredObjectValues"
import type { MetadataItemRule } from "../../orchestration/property/types"

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

export const prepareConfigurationXML = (params: {
  context: ConfigurationContextWithExportToXML
  preparedYamlFile: PreparedYamlFile
  childObjects?: ConfigurationChildObjectsXML
  referenceXML?: Record<string, unknown>
  externalWriteFactory?: YAMLToXMLExternalWriteFactory
  profile?: YAMLToXMLProfile
}): {
  xml: Record<string, unknown>
  deferred: readonly DeferredObjectValue[]
  rootRule: MetadataItemRule
  externalWrites: readonly YAMLToXMLExternalWrite[]
} => {
  const yaml = params.preparedYamlFile.data as MetadataConfigurationYAML | undefined
  if (yaml === undefined) {
    throw new Error(`Подготовленные YAML-данные конфигурации отсутствуют: ${params.preparedYamlFile.projectPath}`)
  }
  const converted = convertMetadataItemFromYAMLToXML({
    context: params.context,
    yaml,
    rule: MetadataConfigurationRules,
    name: typeof yaml.Имя === "string" ? yaml.Имя : undefined,
    outputs: [{ key: "configuration", referenceXML: params.referenceXML }],
    externalWriteFactory: params.externalWriteFactory,
    profile: params.profile,
    rulePath: [MetadataConfigurationRules.itemType],
  })
  const xmlObject = converted.outputs.get("configuration")
  if (xmlObject === undefined) throw new Error("Преобразование конфигурации не сформировало XML")
  if (params.childObjects !== undefined) setConfigurationChildObjectsXML(xmlObject, params.childObjects)
  return {
    xml: xmlObject,
    deferred: bindDeferredObjectValues(xmlObject, converted.deferredByOutput.get("configuration") ?? []),
    rootRule: MetadataConfigurationRules,
    externalWrites: converted.externalWrites,
  }
}

export const writePreparedConfigurationToXML = (params: {
  context: ConfigurationContextWithExportToXML
  outputDir: string
  preparedYamlFile: PreparedYamlFile
  childObjects?: ConfigurationChildObjectsXML
  referenceXML?: Record<string, unknown>
  externalWriteFactory?: YAMLToXMLExternalWriteFactory
  profile?: YAMLToXMLProfile
}): readonly YAMLToXMLExternalWrite[] => {
  const prepared = prepareConfigurationXML(params)
  fs.mkdirSync(params.outputDir, { recursive: true })
  fs.writeFileSync(join(params.outputDir, CONFIGURATION_XML_FILE), xmlExport(prepared.xml), "utf-8")
  return prepared.externalWrites
}

export const readRawConfigurationXML = (inputDir: string): Record<string, unknown> =>
  importContentFromXML<Record<string, unknown>>(fs.readFileSync(join(inputDir, CONFIGURATION_XML_FILE), "utf-8"), {
    preserveXsiNil: true,
    preserveEmptyElements: true,
  })
