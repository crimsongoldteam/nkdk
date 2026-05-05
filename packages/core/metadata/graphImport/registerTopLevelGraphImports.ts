import { importMetadataCatalogFromYAML } from "~/metadata/appliedObjects/metadataCatalog/fromYAML"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import { MetadataDocumentRules } from "~/metadata/appliedObjects/metadataDocument/rules"
import { importMetadataEnumerationFromYAML } from "~/metadata/appliedObjects/metadataEnumeration/fromYAML"
import { MetadataEnumerationRules } from "~/metadata/appliedObjects/metadataEnumeration/rules"
import {
  registerGraphImport,
  toGraphModel,
  type GraphImportSourceMatch,
} from "~/metadata/orchestration/graphImport/registry"
import { declareMetadataItemGraphRoot } from "~/metadata/orchestration/graphImport/root"
import { importMetadataItemFromYAML } from "~/metadata/orchestration/metadataItem/fromYAML"

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
}

function matchTopLevelPath(dir: string, kind: string) {
  return (filePath: string): GraphImportSourceMatch | undefined => {
    const parts = filePath.split("/")
    if (parts.length !== 3 || parts[0] !== dir || parts[2] !== "Свойства.yaml") return undefined
    return { kind, name: parts[1]!, pathParams: { dir } }
  }
}
