import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { TopLevelMetadataItemRules } from "./topLevelRules"

export type ConfigurationChildObjectsXML = Record<string, string | string[]>

export const STANDARD_CHILD_OBJECT_TYPE_ORDER = [
  "Language",
  "Subsystem",
  "StyleItem",
  "Style",
  "CommonPicture",
  "Interface",
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
    ? (xmlRoot as unknown as { container: string }).container
    : undefined
}

const getSupportedChildObjectSpecs = (): ChildObjectSpec[] =>
  TopLevelMetadataItemRules.flatMap((rule) => {
    const yamlDir = rule.itemTypePrefix
    const xmlName = getXMLRootContainer(rule)
    return yamlDir !== undefined && xmlName !== undefined ? [{ yamlDir, xmlName }] : []
  })

const toXMLValue = (names: string[]): string | string[] | undefined => {
  if (names.length === 0) return undefined
  return names.length === 1 ? names[0] : names
}

export const buildConfigurationChildObjectsFromProjectEntries = (params: {
  entries: readonly { dir: string; name: string }[]
}): ConfigurationChildObjectsXML => {
  const result: ConfigurationChildObjectsXML = {}
  const specsByXMLName = new Map(getSupportedChildObjectSpecs().map((spec) => [spec.xmlName, spec]))
  const namesByDir = new Map<string, Set<string>>()
  for (const entry of params.entries) {
    if (entry.dir.length === 0 || entry.name.length === 0) continue
    const names = namesByDir.get(entry.dir) ?? new Set<string>()
    names.add(entry.name)
    namesByDir.set(entry.dir, names)
  }

  for (const xmlName of STANDARD_CHILD_OBJECT_TYPE_ORDER) {
    const spec = specsByXMLName.get(xmlName)
    if (!spec) continue

    const yamlNames = new Set(namesByDir.get(spec.yamlDir) ?? [])
    if (yamlNames.size === 0) continue

    const newNames = [...yamlNames].sort((a, b) => a.localeCompare(b, "ru"))
    const value = toXMLValue(newNames)

    if (value !== undefined) {
      result[xmlName] = value
    }
  }

  return result
}
