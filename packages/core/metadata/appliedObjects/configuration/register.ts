import { registerProjectSpec } from "../../project/projectSpecRegistry"
import { registerProjectJSONSchema } from "../../project/schemaRegistry"
import { join } from "path"
import { createMetadataItemProjectSchemaExporter } from "../../project/projectSpecHelpers"
import { exportMetadataItemToJSONSchema } from "../../ruleRuntime/metadataItem/toJSONSchema"
import {
  registerProjectFileValidator,
  registerProjectReferenceObjectPathContributor,
  registerProjectReferenceValueContributor,
} from "../../validation/projectReferenceIndexRegistry"
import { MetadataSubsystemRules } from "../metadataSubsystem/rules"
import { MetadataConfigurationRules } from "./rules"
import { TopLevelMetadataItemRules } from "./topLevelRules"
import "../metadataExternalDataSource/register"
import "../metadataSubsystem/register"
import { registerMetadataXmlPrepareCapability } from "../../resourceTopology/adapters/capabilities"
import { prepareConfigurationXML } from "./rootIO"
import { buildConfigurationChildObjectsFromProjectEntries } from "./childObjects"
import { configurationChildObjectsFromIndex } from "./configurationChildObjects"
import { registerFullXmlSyncComponentProfile } from "../../fullSyncToXml/componentProfile"
import { configurationFullXmlSyncProfile } from "../../fullSyncToXml/profiles/configuration"
import { registerMetadataComponentDescriptor } from "../../components/descriptor"
import { registerXmlImportComponentDescriptor } from "../../importFromXml/componentDescriptor"

registerFullXmlSyncComponentProfile(configurationFullXmlSyncProfile)
registerMetadataComponentDescriptor({
  kind: "configuration",
  rootRule: MetadataConfigurationRules,
})
registerXmlImportComponentDescriptor({
  kind: "configuration",
  detect(root) {
    const configuration = root["Configuration"]
    if (!isRecord(configuration)) return false
    const properties = configuration["Properties"]
    return !isRecord(properties) || !("ConfigurationExtensionPurpose" in properties)
  },
  resolveAddress: () => ({ kind: "configuration" }),
})

const objectOwnedProjectSpecDirs = new Set(["Справочник", "Документ", "Перечисление"])
const specialObjectPathProjectSpecDirs = new Set(["ВнешнийИсточникДанных", "Подсистема"])
const predefinedValueRoots = new Set([
  "Catalog",
  "ChartOfAccounts",
  "ChartOfCalculationTypes",
  "ChartOfCharacteristicTypes",
  "ExchangePlan",
])

registerProjectSpec({
  kind: "configuration",
  dir: "",
  rule: MetadataConfigurationRules,
  exportSchema: createMetadataItemProjectSchemaExporter(MetadataConfigurationRules),
})

registerMetadataXmlPrepareCapability({
  id: "configuration",
  run: ({ context, preparedYamlFile, assignment, logicalAddress, outputs, composition, profile }) => {
    const output = outputs.find((candidate) => candidate.role === "metadata")
    if (output === undefined) return []
    const currentChildObjects = buildConfigurationChildObjectsFromProjectEntries({
      entries: composition.children(logicalAddress)
        .filter((entry) => entry.assignmentRole === "properties")
        .map((entry) => {
          const parts = entry.sourceProjectPath.split("/")
          return { dir: parts[0] ?? "", name: parts[1] ?? entry.itemName }
        }),
    })
    const prepared = prepareConfigurationXML({
      context,
      preparedYamlFile,
      rootRule: assignment.itemRule,
      childObjects: configurationChildObjectsFromIndex(context.exportToXML.configurationIndex, currentChildObjects),
      profile,
    })
    return [{ declarationId: output.declarationId, targetXmlPath: output.targetXmlPath, ...prepared }]
  },
})

registerProjectFileValidator("configuration", ({ filePath, parsed }) => {
  if (parsed.data === null || typeof parsed.data !== "object" || Array.isArray(parsed.data)) return []
  if (Object.prototype.hasOwnProperty.call(parsed.data, "ОсновнойЯзык")) return []

  return [
    {
      filePath,
      line: 1,
      col: 1,
      severity: "error",
      source: "structure",
      path: "/ОсновнойЯзык",
      message: 'Отсутствует обязательное свойство "ОсновнойЯзык"',
    },
  ]
})

for (const rule of TopLevelMetadataItemRules) {
  const dir = rule.itemTypePrefix
  if (typeof dir !== "string") continue
  if (objectOwnedProjectSpecDirs.has(dir)) continue
  registerProjectJSONSchema(rule.itemType, ({ context }) => exportMetadataItemToJSONSchema({ context, rule }))
  const owner = rule.metadataTargetOwner
  if (owner?.kind === "self" && !specialObjectPathProjectSpecDirs.has(dir)) {
    registerProjectReferenceObjectPathContributor(owner.root, ({ projectDir, target }) => ({
      filePath: join(projectDir, dir, target.objectName, "Свойства.yaml"),
    }))
    if (predefinedValueRoots.has(owner.root)) {
      registerProjectReferenceValueContributor(owner.root, ({ owner, target }) => {
        if (target.valueKind === "emptyRef") return undefined
        const values = metadataRecord(owner.facts).predefined
        return hasNamedItem(values, target.valueName) ? { ok: true, filePath: owner.filePath } : undefined
      })
    }
  }

  registerProjectSpec({
    kind: rule.itemType,
    dir,
    rule,
    exportSchema: createMetadataItemProjectSchemaExporter(rule),
    ...(rule.itemType === MetadataSubsystemRules.itemType
      ? {
          nesting: {
            kind: "recursiveChildDir" as const,
            childDir: "Подсистемы",
            itemRole: "subsystem",
            collectionRole: "subsystems",
            logicalAddressSegment: "Подсистема",
          },
        }
      : {}),
  })
}

function hasNamedItem(value: unknown, name: string): boolean {
  if (Array.isArray(value)) return value.some((item) => hasNamedItem(item, name))
  if (typeof value !== "object" || value === null) return false

  const record = value as Record<string, unknown>
  if (record.name === name) return true
  if (Object.prototype.hasOwnProperty.call(record, name)) return true

  return (
    hasNamedItem(record.items, name) || hasNamedItem(record.childItems, name) || hasNamedItem(record.enumValues, name)
  )
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
