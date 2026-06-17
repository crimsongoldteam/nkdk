import "~/metadata/appliedObjects"
import "~/metadata/commonObjects"
import "~/metadata/forms"
import type { TSchema } from "@sinclair/typebox"
import { MetadataAccountingRegisterRules } from "~/metadata/appliedObjects/metadataAccountingRegister/rules"
import { MetadataAccumulationRegisterRules } from "~/metadata/appliedObjects/metadataAccumulationRegister/rules"
import { MetadataBusinessProcessRules } from "~/metadata/appliedObjects/metadataBusinessProcess/rules"
import { importMetadataCatalogFromYAML } from "~/metadata/appliedObjects/metadataCatalog/fromYAML"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import { exportMetadataCatalogToJSONSchema } from "~/metadata/appliedObjects/metadataCatalog/toJSONSchema"
import { MetadataChartOfAccountsRules } from "~/metadata/appliedObjects/metadataChartOfAccounts/rules"
import { MetadataChartOfCalculationTypesRules } from "~/metadata/appliedObjects/metadataChartOfCalculationTypes/rules"
import { MetadataChartOfCharacteristicTypesRules } from "~/metadata/appliedObjects/metadataChartOfCharacteristicTypes/rules"
import { MetadataCalculationRegisterRules } from "~/metadata/appliedObjects/metadataCalculationRegister/rules"
import { MetadataDataProcessorRules } from "~/metadata/appliedObjects/metadataDataProcessor/rules"
import { MetadataDocumentRules } from "~/metadata/appliedObjects/metadataDocument/rules"
import { exportMetadataDocumentToJSONSchema } from "~/metadata/appliedObjects/metadataDocument/toJSONSchema"
import { MetadataDocumentJournalRules } from "~/metadata/appliedObjects/metadataDocumentJournal/rules"
import { importMetadataEnumerationFromYAML } from "~/metadata/appliedObjects/metadataEnumeration/fromYAML"
import { MetadataEnumerationRules } from "~/metadata/appliedObjects/metadataEnumeration/rules"
import { exportMetadataEnumerationToJSONSchema } from "~/metadata/appliedObjects/metadataEnumeration/toJSONSchema"
import { MetadataExchangePlanRules } from "~/metadata/appliedObjects/metadataExchangePlan/rules"
import { MetadataHTTPServiceRules } from "~/metadata/appliedObjects/metadataHTTPService/rules"
import { MetadataInformationRegisterRules } from "~/metadata/appliedObjects/metadataInformationRegister/rules"
import { MetadataReportRules } from "~/metadata/appliedObjects/metadataReport/rules"
import { MetadataTaskRules } from "~/metadata/appliedObjects/metadataTask/rules"
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

export const validationProjectSpecs: readonly ValidationProjectSpec[] = [
  {
    kind: "catalog",
    dir: "Справочник",
    rule: MetadataCatalogRules,
    exportSchema: createSchemaExporter(exportMetadataCatalogToJSONSchema),
    importModel: ({ context, parsed, name }) => importMetadataCatalogFromYAML(context, parsed.data, name),
  },
  {
    kind: "document",
    dir: "Документ",
    rule: MetadataDocumentRules,
    exportSchema: createSchemaExporter(exportMetadataDocumentToJSONSchema),
    importModel: genericImportModel(MetadataDocumentRules),
  },
  {
    kind: "enumeration",
    dir: "Перечисление",
    rule: MetadataEnumerationRules,
    exportSchema: createSchemaExporter(exportMetadataEnumerationToJSONSchema),
    importModel: ({ context, parsed, name }) => importMetadataEnumerationFromYAML(context, parsed.data, name),
  },
  {
    kind: "dataProcessor",
    dir: "Обработка",
    rule: MetadataDataProcessorRules,
    exportSchema: createMetadataItemSchemaExporter(MetadataDataProcessorRules),
    importModel: genericImportModel(MetadataDataProcessorRules),
  },
  {
    kind: "report",
    dir: "Отчет",
    rule: MetadataReportRules,
    exportSchema: createMetadataItemSchemaExporter(MetadataReportRules),
    importModel: genericImportModel(MetadataReportRules),
  },
  {
    kind: "documentJournal",
    dir: "ЖурналДокументов",
    rule: MetadataDocumentJournalRules,
    exportSchema: createMetadataItemSchemaExporter(MetadataDocumentJournalRules),
    importModel: genericImportModel(MetadataDocumentJournalRules),
  },
  {
    kind: "httpService",
    dir: "HTTPСервис",
    rule: MetadataHTTPServiceRules,
    exportSchema: createMetadataItemSchemaExporter(MetadataHTTPServiceRules),
    importModel: genericImportModel(MetadataHTTPServiceRules),
  },
  {
    kind: "informationRegister",
    dir: "РегистрСведений",
    rule: MetadataInformationRegisterRules,
    exportSchema: createMetadataItemSchemaExporter(MetadataInformationRegisterRules),
    importModel: genericImportModel(MetadataInformationRegisterRules),
  },
  {
    kind: "accumulationRegister",
    dir: "РегистрНакопления",
    rule: MetadataAccumulationRegisterRules,
    exportSchema: createMetadataItemSchemaExporter(MetadataAccumulationRegisterRules),
    importModel: genericImportModel(MetadataAccumulationRegisterRules),
  },
  {
    kind: "accountingRegister",
    dir: "РегистрБухгалтерии",
    rule: MetadataAccountingRegisterRules,
    exportSchema: createMetadataItemSchemaExporter(MetadataAccountingRegisterRules),
    importModel: genericImportModel(MetadataAccountingRegisterRules),
  },
  {
    kind: "calculationRegister",
    dir: "РегистрРасчета",
    rule: MetadataCalculationRegisterRules,
    exportSchema: createMetadataItemSchemaExporter(MetadataCalculationRegisterRules),
    importModel: genericImportModel(MetadataCalculationRegisterRules),
  },
  {
    kind: "exchangePlan",
    dir: "ПланОбмена",
    rule: MetadataExchangePlanRules,
    exportSchema: createMetadataItemSchemaExporter(MetadataExchangePlanRules),
    importModel: genericImportModel(MetadataExchangePlanRules),
  },
  {
    kind: "chartOfAccounts",
    dir: "ПланСчетов",
    rule: MetadataChartOfAccountsRules,
    exportSchema: createMetadataItemSchemaExporter(MetadataChartOfAccountsRules),
    importModel: genericImportModel(MetadataChartOfAccountsRules),
  },
  {
    kind: "chartOfCalculationTypes",
    dir: "ПланВидовРасчета",
    rule: MetadataChartOfCalculationTypesRules,
    exportSchema: createMetadataItemSchemaExporter(MetadataChartOfCalculationTypesRules),
    importModel: genericImportModel(MetadataChartOfCalculationTypesRules),
  },
  {
    kind: "chartOfCharacteristicTypes",
    dir: "ПланВидовХарактеристик",
    rule: MetadataChartOfCharacteristicTypesRules,
    exportSchema: createMetadataItemSchemaExporter(MetadataChartOfCharacteristicTypesRules),
    importModel: genericImportModel(MetadataChartOfCharacteristicTypesRules),
  },
  {
    kind: "businessProcess",
    dir: "БизнесПроцесс",
    rule: MetadataBusinessProcessRules,
    exportSchema: createMetadataItemSchemaExporter(MetadataBusinessProcessRules),
    importModel: genericImportModel(MetadataBusinessProcessRules),
  },
  {
    kind: "task",
    dir: "Задача",
    rule: MetadataTaskRules,
    exportSchema: createMetadataItemSchemaExporter(MetadataTaskRules),
    importModel: genericImportModel(MetadataTaskRules),
  },
]

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
