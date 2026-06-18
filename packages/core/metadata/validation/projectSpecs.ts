import "~/metadata/appliedObjects"
import "~/metadata/commonObjects"
import "~/metadata/forms"
import type { TSchema } from "@sinclair/typebox"
import { MetadataConfigurationRules } from "~/metadata/appliedObjects/configuration/rules"
import { TopLevelMetadataItemRules } from "~/metadata/appliedObjects/configuration/topLevelRules"
import { importMetadataCatalogFromYAML } from "~/metadata/appliedObjects/metadataCatalog/fromYAML"
import { exportMetadataCatalogToJSONSchema } from "~/metadata/appliedObjects/metadataCatalog/toJSONSchema"
import { exportMetadataDocumentToJSONSchema } from "~/metadata/appliedObjects/metadataDocument/toJSONSchema"
import { importMetadataEnumerationFromYAML } from "~/metadata/appliedObjects/metadataEnumeration/fromYAML"
import { exportMetadataEnumerationToJSONSchema } from "~/metadata/appliedObjects/metadataEnumeration/toJSONSchema"
import type { ConfigurationContext, JSONSchemaExportMode } from "~/metadata/context/types"
import {
  attachCollectedSchemaRefs,
  createJSONSchemaExportContext,
} from "~/metadata/orchestration/jsonSchemaRefs"
import { importMetadataItemFromYAML } from "~/metadata/orchestration/metadataItem/fromYAML"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import type { MetadataItem, MetadataItemRule } from "~/metadata/orchestration/property/types"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"
import { ensureJSONSchemaRegistry } from "./schemaRegistry"

export interface ValidationProjectSpec {
  kind: string
  dir: string
  rule: MetadataItemRule
  exportSchema: (params: { context: ConfigurationContext; mode?: JSONSchemaExportMode }) => TSchema
  importModel: (params: { context: ConfigurationContext; parsed: ParsedYaml; name: string }) => MetadataItem | undefined
}

type SchemaExporter = (params: { context: ConfigurationContext }) => TSchema

type ValidationProjectSpecOverride = Partial<Pick<ValidationProjectSpec, "kind" | "exportSchema" | "importModel">>

const validationProjectSpecOverrides = new Map<string, ValidationProjectSpecOverride>([
  [
    "Справочник",
    {
      kind: "catalog",
      exportSchema: createSchemaExporter(exportMetadataCatalogToJSONSchema),
      importModel: ({ context, parsed, name }) => importMetadataCatalogFromYAML(context, parsed.data, name),
    },
  ],
  [
    "Документ",
    {
      kind: "document",
      exportSchema: createSchemaExporter(exportMetadataDocumentToJSONSchema),
    },
  ],
  [
    "Перечисление",
    {
      kind: "enumeration",
      exportSchema: createSchemaExporter(exportMetadataEnumerationToJSONSchema),
      importModel: ({ context, parsed, name }) => importMetadataEnumerationFromYAML(context, parsed.data, name),
    },
  ],
])

export const validationProjectSpecs: readonly ValidationProjectSpec[] = TopLevelMetadataItemRules.flatMap((rule) => {
  const dir = rule.itemTypePrefix
  if (typeof dir !== "string") return []

  const override = validationProjectSpecOverrides.get(dir)

  return [
    {
      kind: override?.kind ?? rule.itemType,
      dir,
      rule,
      exportSchema: override?.exportSchema ?? createMetadataItemSchemaExporter(rule),
      importModel: override?.importModel ?? genericImportModel(rule),
    },
  ]
})

export const configurationValidationProjectSpec: ValidationProjectSpec = {
  kind: "configuration",
  dir: "",
  rule: MetadataConfigurationRules,
  exportSchema: createMetadataItemSchemaExporter(MetadataConfigurationRules),
  importModel: genericImportModel(MetadataConfigurationRules),
}

export const validationProjectSpecByDir = new Map(validationProjectSpecs.map((spec) => [spec.dir, spec]))

export function getValidationProjectSpecByDir(dir: string): ValidationProjectSpec | undefined {
  return validationProjectSpecByDir.get(dir)
}

function createMetadataItemSchemaExporter(rule: MetadataItemRule): ValidationProjectSpec["exportSchema"] {
  return createSchemaExporter(({ context }) => exportMetadataItemToJSONSchema({ context, rule }))
}

function createSchemaExporter(exporter: SchemaExporter): ValidationProjectSpec["exportSchema"] {
  return ({ context, mode = "externalRefs" }) => {
    ensureJSONSchemaRegistry()

    const schemaContext = createJSONSchemaExportContext(context, mode)
    const schema = exporter({ context: schemaContext })

    return mode === "externalRefs" ? attachCollectedSchemaRefs(schemaContext, schema) : schema
  }
}

function genericImportModel(rule: MetadataItemRule): ValidationProjectSpec["importModel"] {
  return ({ context, parsed, name }) => {
    const model: unknown = importMetadataItemFromYAML({ context, yaml: parsed.data, rule, name })

    return isMetadataItem(model) ? model : undefined
  }
}

function isMetadataItem(value: unknown): value is MetadataItem {
  return typeof value === "object" && value !== null && "itemType" in value
}
