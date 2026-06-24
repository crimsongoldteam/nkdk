import fs from "fs"
import { join } from "path"
import { importContentFromXML } from "~/xml/import/importer"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { CONFIGURATION_XML_FILE } from "./rootIO"
import { TopLevelMetadataItemRules } from "./topLevelRules"

export type ConfigurationChildObjectsXML = Record<string, string | string[]>

const PROPERTIES_YAML = "Свойства.yaml"

export const STANDARD_CHILD_OBJECT_TYPE_ORDER = [
  "Language",
  "Subsystem",
  "StyleItem",
  "Style",
  "CommonPicture",
  "SessionParameter",
  "Role",
  "CommonTemplate",
  "FilterCriterion",
  "CommonModule",
  "CommonAttribute",
  "ExchangePlan",
  "XDTOPackage",
  "WebService",
  "HTTPService",
  "WSReference",
  "WebSocketClient",
  "EventSubscription",
  "ScheduledJob",
  "SettingsStorage",
  "FunctionalOption",
  "FunctionalOptionsParameter",
  "DefinedType",
  "Bot",
  "CommonCommand",
  "CommandGroup",
  "Constant",
  "CommonForm",
  "Catalog",
  "Document",
  "DocumentNumerator",
  "Sequence",
  "DocumentJournal",
  "Enum",
  "Report",
  "DataProcessor",
  "InformationRegister",
  "AccumulationRegister",
  "ChartOfCharacteristicTypes",
  "ChartOfAccounts",
  "AccountingRegister",
  "ChartOfCalculationTypes",
  "CalculationRegister",
  "BusinessProcess",
  "Task",
  "ExternalDataSource",
  "IntegrationService",
] as const

interface ChildObjectSpec {
  xmlName: string
  yamlDir: string
}

const getXMLRootContainer = (rule: MetadataItemRule): string | undefined => {
  const xmlRoot = Object.values(rule.properties).find((property) => property.type === "XMLRoot")
  return typeof (xmlRoot as { container?: unknown } | undefined)?.container === "string"
    ? ((xmlRoot as { container: string }).container)
    : undefined
}

const getSupportedChildObjectSpecs = (): ChildObjectSpec[] =>
  TopLevelMetadataItemRules.flatMap((rule) => {
    const yamlDir = rule.itemTypePrefix
    const xmlName = getXMLRootContainer(rule)
    return yamlDir !== undefined && xmlName !== undefined ? [{ yamlDir, xmlName }] : []
  })

const readYAMLObjectNames = (yamlRoot: string, yamlDir: string): string[] => {
  const dir = join(yamlRoot, yamlDir)
  if (!fs.existsSync(dir)) return []

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(join(dir, entry.name, PROPERTIES_YAML)))
    .map((entry) => entry.name)
}

const normalizeReferenceNames = (childObjects: ConfigurationChildObjectsXML | undefined, xmlName: string): string[] => {
  const value = childObjects?.[xmlName]
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

const toXMLValue = (names: string[]): string | string[] | undefined => {
  if (names.length === 0) return undefined
  return names.length === 1 ? names[0] : names
}

export const readConfigurationChildObjectsFromXML = (inputDir: string): ConfigurationChildObjectsXML | undefined => {
  const source = fs.readFileSync(join(inputDir, CONFIGURATION_XML_FILE), "utf-8")
  const parsed = importContentFromXML<{
    MetaDataObject?: { Configuration?: { ChildObjects?: ConfigurationChildObjectsXML | "" } }
  }>(source)
  const childObjects = parsed.MetaDataObject?.Configuration?.ChildObjects
  return childObjects !== "" ? childObjects : undefined
}

export const buildConfigurationChildObjects = (params: {
  yamlDir: string
  referenceChildObjects?: ConfigurationChildObjectsXML
}): ConfigurationChildObjectsXML => {
  const result: ConfigurationChildObjectsXML = {}
  const specsByXMLName = new Map(getSupportedChildObjectSpecs().map((spec) => [spec.xmlName, spec]))

  for (const xmlName of STANDARD_CHILD_OBJECT_TYPE_ORDER) {
    const spec = specsByXMLName.get(xmlName)
    if (!spec) continue

    const yamlNames = new Set(readYAMLObjectNames(params.yamlDir, spec.yamlDir))
    if (yamlNames.size === 0) continue

    const referenceNames = normalizeReferenceNames(params.referenceChildObjects, xmlName)
    const orderedExisting = referenceNames.filter((name) => yamlNames.delete(name))
    const newNames = [...yamlNames].sort((a, b) => a.localeCompare(b, "ru"))
    const value = toXMLValue([...orderedExisting, ...newNames])

    if (value !== undefined) {
      result[xmlName] = value
    }
  }

  return result
}
