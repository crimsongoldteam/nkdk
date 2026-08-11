import { composeMetadataRules } from "../ruleRuntime/definition"
import { defineProjectSpec } from "../projectDefinition/projectSpecRegistry"
import {
  createMetadataItemProjectSchemaExporter,
  createProjectSchemaExporter,
} from "../projectDefinition/projectSpecHelpers"
import { MetadataConfigurationRules } from "./configuration/rules"
import { MetadataCatalogRules } from "./metadataCatalog/rules"
import { exportMetadataCatalogToJSONSchema } from "./metadataCatalog/toJSONSchema"
import { MetadataDocumentRules } from "./metadataDocument/rules"
import { exportMetadataDocumentToJSONSchema } from "./metadataDocument/toJSONSchema"
import { MetadataEnumerationRules } from "./metadataEnumeration/rules"
import { exportMetadataEnumerationToJSONSchema } from "./metadataEnumeration/toJSONSchema"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"

const fixedAppliedObjectProjectRules = composeMetadataRules(
  defineProjectSpec({
    kind: "configuration",
    dir: "",
    rule: MetadataConfigurationRules,
    exportSchema: createMetadataItemProjectSchemaExporter(
      MetadataConfigurationRules,
    ),
  }),
  defineProjectSpec({
    kind: "catalog",
    dir: "Справочник",
    rule: MetadataCatalogRules,
    exportSchema: createProjectSchemaExporter(({ context }) =>
      exportMetadataCatalogToJSONSchema({ context }),
    ),
  }),
  defineProjectSpec({
    kind: "document",
    dir: "Документ",
    rule: MetadataDocumentRules,
    exportSchema: createProjectSchemaExporter(({ context }) =>
      exportMetadataDocumentToJSONSchema({ context }),
    ),
  }),
  defineProjectSpec({
    kind: "enumeration",
    dir: "Перечисление",
    rule: MetadataEnumerationRules,
    exportSchema: createProjectSchemaExporter(({ context }) =>
      exportMetadataEnumerationToJSONSchema({ context }),
    ),
  }),
)

export function defineAppliedObjectProjectRules(
  metadataItems: Readonly<Record<string, MetadataItemRule>>,
) {
  const fixedDirs = new Set(Object.keys(fixedAppliedObjectProjectRules.projectSpecs))
  const dynamicProjectRules = Object.values(metadataItems).flatMap((rule) => {
    const dir = rule.itemTypePrefix
    if (typeof dir !== "string" || fixedDirs.has(dir)) return []
    return [
      defineProjectSpec({
        kind: rule.itemType,
        dir,
        rule,
        exportSchema: createMetadataItemProjectSchemaExporter(rule),
        ...(rule.itemType === "MetadataSubsystem"
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
      }),
    ]
  })

  return composeMetadataRules(
    fixedAppliedObjectProjectRules,
    ...dynamicProjectRules,
  )
}
