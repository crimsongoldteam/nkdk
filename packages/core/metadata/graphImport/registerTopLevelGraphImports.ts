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
  type GraphImportSourceMatch,
} from "~/metadata/orchestration/graphImport/registry"
import { declareMetadataItemGraphRoot } from "~/metadata/orchestration/graphImport/root"
import { importMetadataItemFromYAML } from "~/metadata/orchestration/metadataItem/fromYAML"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"

export function registerTopLevelGraphImports(): void {
  registerGraphImport({
    kind: "catalog",
    phase: 0,
    matchPath: matchTopLevelPath("Справочник", "catalog"),
    importModel: ({ context, parsed, name }) => {
      const model = importMetadataCatalogFromYAML(context, parsed.data, name)
      if (!model) return undefined
      return { model, graphModel: toGraphModel(model), rule: MetadataCatalogRules }
    },
    declareRoot: ({ graph, rule, name, filePath }) =>
      declareMetadataItemGraphRoot({ graph, rule, name, filePath }),
  })

  registerGraphImport({
    kind: "document",
    phase: 0,
    matchPath: matchTopLevelPath("Документ", "document"),
    importModel: ({ context, parsed, name }) => {
      const model = importMetadataItemFromYAML({
        context,
        yaml: parsed.data,
        rule: MetadataDocumentRules,
        name,
      })
      if (!model) return undefined
      return { model, graphModel: toGraphModel(model), rule: MetadataDocumentRules }
    },
    declareRoot: ({ graph, rule, name, filePath }) =>
      declareMetadataItemGraphRoot({ graph, rule, name, filePath }),
  })

  registerGraphImport({
    kind: "enumeration",
    phase: 0,
    matchPath: matchTopLevelPath("Перечисление", "enumeration"),
    importModel: ({ context, parsed, name }) => {
      const model = importMetadataEnumerationFromYAML(context, parsed.data, name)
      if (!model) return undefined
      return { model, graphModel: toGraphModel(model), rule: MetadataEnumerationRules }
    },
    declareRoot: ({ graph, rule, name, filePath }) =>
      declareMetadataItemGraphRoot({ graph, rule, name, filePath }),
  })

  registerTopLevelMetadataItem("dataProcessor", "Обработка", MetadataDataProcessorRules)
  registerTopLevelMetadataItem("documentJournal", "ЖурналДокументов", MetadataDocumentJournalRules)
  registerTopLevelMetadataItem("httpService", "HTTPСервис", MetadataHTTPServiceRules)
  registerTopLevelMetadataItem("informationRegister", "РегистрСведений", MetadataInformationRegisterRules)
  registerTopLevelMetadataItem("accumulationRegister", "РегистрНакопления", MetadataAccumulationRegisterRules)
  registerTopLevelMetadataItem("exchangePlan", "ПланОбмена", MetadataExchangePlanRules)
}

function registerTopLevelMetadataItem(kind: string, dir: string, rule: MetadataItemRule) {
  registerGraphImport({
    kind,
    phase: 0,
    matchPath: matchTopLevelPath(dir, kind),
    importModel: ({ context, parsed, name }) => {
      const model = importMetadataItemFromYAML({ context, yaml: parsed.data, rule, name })
      if (!model) return undefined
      const graphModel = model as GraphImportedMetadataModel
      return { model: graphModel, graphModel: toGraphModel(graphModel), rule }
    },
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
