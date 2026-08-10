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

export const appliedObjectProjectRules = composeMetadataRules(
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
