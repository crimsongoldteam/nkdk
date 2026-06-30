import { registerProjectSpec } from "~/metadata/project/projectSpecRegistry"
import { registerProjectJSONSchema } from "~/metadata/project/schemaRegistry"
import { join } from "path"
import {
  createGenericProjectImportModel,
  createMetadataItemProjectSchemaExporter,
} from "~/metadata/project/projectSpecHelpers"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import {
  registerProjectFileValidator,
  registerProjectObjectPathResolver,
  registerProjectValueResolver,
} from "~/metadata/validation/projectMetadataResolverRegistry"
import { MetadataSubsystemRules } from "../metadataSubsystem/rules"
import { MetadataConfigurationRules } from "./rules"
import { TopLevelMetadataItemRules } from "./topLevelRules"
import "../metadataExternalDataSource/register"
import "../metadataSubsystem/register"

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
  importModel: createGenericProjectImportModel(MetadataConfigurationRules),
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
    registerProjectObjectPathResolver(owner.root, ({ projectDir, target }) => ({
      filePath: join(projectDir, dir, target.objectName, "Свойства.yaml"),
    }))
    if (predefinedValueRoots.has(owner.root)) {
      registerProjectValueResolver(owner.root, ({ owner, target }) => {
        if (target.valueKind === "emptyRef") return undefined
        const values = metadataRecord(owner.model).predefined
        return hasNamedItem(values, target.valueName) ? { ok: true, filePath: owner.filePath } : undefined
      })
    }
  }

  registerProjectSpec({
    kind: rule.itemType,
    dir,
    rule,
    exportSchema: createMetadataItemProjectSchemaExporter(rule),
    importModel: createGenericProjectImportModel(rule),
    ...(rule.itemType === MetadataSubsystemRules.itemType
      ? {
          nesting: {
            kind: "recursiveChildDir" as const,
            childDir: "Подсистемы",
            itemRole: "subsystem",
            collectionRole: "subsystems",
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

  return hasNamedItem(record.items, name) || hasNamedItem(record.childItems, name) || hasNamedItem(record.enumValues, name)
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
}
