import { registerProjectSpec } from "~/metadata/project/projectSpecRegistry"
import { registerProjectJSONSchema } from "~/metadata/project/schemaRegistry"
import {
  createGenericProjectImportModel,
  createMetadataItemProjectSchemaExporter,
} from "~/metadata/project/projectSpecHelpers"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { MetadataSubsystemRules } from "../metadataSubsystem/rules"
import { MetadataConfigurationRules } from "./rules"
import { TopLevelMetadataItemRules } from "./topLevelRules"

const objectOwnedProjectSpecDirs = new Set(["Справочник", "Документ", "Перечисление"])

registerProjectSpec({
  kind: "configuration",
  dir: "",
  rule: MetadataConfigurationRules,
  exportSchema: createMetadataItemProjectSchemaExporter(MetadataConfigurationRules),
  importModel: createGenericProjectImportModel(MetadataConfigurationRules),
})

for (const rule of TopLevelMetadataItemRules) {
  if (typeof rule.itemTypePrefix !== "string") continue
  if (objectOwnedProjectSpecDirs.has(rule.itemTypePrefix)) continue
  registerProjectJSONSchema(rule.itemType, ({ context }) => exportMetadataItemToJSONSchema({ context, rule }))

  registerProjectSpec({
    kind: rule.itemType,
    dir: rule.itemTypePrefix,
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
