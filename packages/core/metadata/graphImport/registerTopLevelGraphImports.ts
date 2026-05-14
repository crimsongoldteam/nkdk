import { MetadataAccumulationRegisterRules } from "~/metadata/appliedObjects/metadataAccumulationRegister/rules"
import { importMetadataCatalogFromYAML } from "~/metadata/appliedObjects/metadataCatalog/fromYAML"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import { MetadataDataProcessorRules } from "~/metadata/appliedObjects/metadataDataProcessor/rules"
import { MetadataDocumentRules } from "~/metadata/appliedObjects/metadataDocument/rules"
import { MetadataDocumentJournalRules } from "~/metadata/appliedObjects/metadataDocumentJournal/rules"
import { importMetadataEnumerationFromYAML } from "~/metadata/appliedObjects/metadataEnumeration/fromYAML"
import { MetadataEnumerationRules } from "~/metadata/appliedObjects/metadataEnumeration/rules"
import { MetadataExchangePlanRules } from "~/metadata/appliedObjects/metadataExchangePlan/rules"
import { MetadataHTTPServiceRules } from "~/metadata/appliedObjects/metadataHTTPService/rules"
import { MetadataInformationRegisterRules } from "~/metadata/appliedObjects/metadataInformationRegister/rules"
import {
  registerGraphImport,
  toGraphModel,
  type GraphImportedMetadataModel,
  type GraphModelImportParams,
  type GraphModelImportResult,
  type GraphImportSourceMatch,
} from "~/metadata/orchestration/graphImport/registry"
import { declareMetadataItemGraphRoot } from "~/metadata/orchestration/graphImport/root"
import { importMetadataItemFromYAML } from "~/metadata/orchestration/metadataItem/fromYAML"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"

export interface TopLevelGraphImportSpec {
  kind: string
  dir: string
  rule: MetadataItemRule
  importModel?: (params: GraphModelImportParams) => GraphModelImportResult | undefined
}

export const topLevelGraphImportSpecs: TopLevelGraphImportSpec[] = [
  {
    kind: "catalog",
    dir: "Справочник",
    rule: MetadataCatalogRules,
    importModel: ({ context, parsed, name }) => {
      const model = importMetadataCatalogFromYAML(context, parsed.data, name)
      if (!model) return undefined
      return { model, graphModel: toGraphModel(model), rule: MetadataCatalogRules }
    },
  },
  {
    kind: "document",
    dir: "Документ",
    rule: MetadataDocumentRules,
  },
  {
    kind: "enumeration",
    dir: "Перечисление",
    rule: MetadataEnumerationRules,
    importModel: ({ context, parsed, name }) => {
      const model = importMetadataEnumerationFromYAML(context, parsed.data, name)
      if (!model) return undefined
      return { model, graphModel: toGraphModel(model), rule: MetadataEnumerationRules }
    },
  },
  {
    kind: "dataProcessor",
    dir: "Обработка",
    rule: MetadataDataProcessorRules,
  },
  {
    kind: "documentJournal",
    dir: "ЖурналДокументов",
    rule: MetadataDocumentJournalRules,
  },
  {
    kind: "httpService",
    dir: "HTTPСервис",
    rule: MetadataHTTPServiceRules,
  },
  {
    kind: "informationRegister",
    dir: "РегистрСведений",
    rule: MetadataInformationRegisterRules,
  },
  {
    kind: "accumulationRegister",
    dir: "РегистрНакопления",
    rule: MetadataAccumulationRegisterRules,
  },
  {
    kind: "exchangePlan",
    dir: "ПланОбмена",
    rule: MetadataExchangePlanRules,
  },
]

export function registerTopLevelGraphImports(): void {
  for (const spec of topLevelGraphImportSpecs) {
    registerTopLevelMetadataItem(spec)
  }
}

function registerTopLevelMetadataItem(spec: TopLevelGraphImportSpec) {
  registerGraphImport({
    kind: spec.kind,
    phase: 0,
    matchPath: matchTopLevelPath(spec.dir, spec.kind),
    importModel: spec.importModel ?? (({ context, parsed, name }) => {
      const model = importMetadataItemFromYAML({ context, yaml: parsed.data, rule: spec.rule, name })
      if (!model) return undefined
      const graphModel = model as GraphImportedMetadataModel
      return { model: graphModel, graphModel: toGraphModel(graphModel), rule: spec.rule }
    }),
    declareRoot: ({ graph, rule, name, filePath }) =>
      declareMetadataItemGraphRoot({ graph, rule, name, filePath }),
  })
}

function matchTopLevelPath(dir: string, kind: string) {
  return (filePath: string): GraphImportSourceMatch | undefined => {
    const parts = filePath.split("/")
    if (parts.length !== 3 || parts[0] !== dir || parts[2] !== "Свойства.yaml") return undefined
    return { kind, name: parts[1]!, pathParams: { dir } }
  }
}
