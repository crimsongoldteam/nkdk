import { existsSync, readdirSync, readFileSync } from "fs"
import { join } from "path"
import { LineCounter } from "yaml"
import { isMap } from "yaml"
import { importMetadataCatalogFromYAML } from "~/metadata/appliedObjects/metadataCatalog/fromYAML"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import { importMetadataDocumentFromYAML } from "~/metadata/appliedObjects/metadataDocument/fromYAML"
import { MetadataDocumentRules } from "~/metadata/appliedObjects/metadataDocument/rules"
import { importMetadataEnumerationFromYAML } from "~/metadata/appliedObjects/metadataEnumeration/fromYAML"
import { MetadataEnumerationRules } from "~/metadata/appliedObjects/metadataEnumeration/rules"
import { ConfigurationContext } from "~/metadata/context/types"
import { buildGraphFromModel } from "~/metadata/orchestration/buildGraphFromModel"
import { MetadataGraph } from "~/metadata/relations/MetadataGraph"
import { parseMetadataYaml } from "~/yaml/parseMetadataYaml"
import { createSchemaCache } from "./schemaCache"
import { Diagnostic, MetadataKind } from "./types"
import { validateItem } from "./validateItem"

interface ItemEntry {
  kind: MetadataKind
  itemDir: string
  name: string
  yamlPath: string
}

function collectItems(projectPath: string): ItemEntry[] {
  const entries: ItemEntry[] = []

  const dirKindMap: Array<[string, MetadataKind]> = [
    ["Справочник", "catalog"],
    ["Документ", "document"],
    ["Перечисление", "enumeration"],
  ]

  for (const [dirName, kind] of dirKindMap) {
    const rootDir = join(projectPath, dirName)
    if (!existsSync(rootDir)) continue

    const subdirs = readdirSync(rootDir, { withFileTypes: true }).filter((e) => e.isDirectory())

    for (const dir of subdirs) {
      const itemDir = join(rootDir, dir.name)
      const yamlPath = join(itemDir, "Свойства.yaml")
      if (!existsSync(yamlPath)) continue

      entries.push({ kind, itemDir, name: dir.name, yamlPath })
    }
  }

  return entries
}

export function validateProject(params: { projectPath: string; context: ConfigurationContext }): Diagnostic[] {
  const { projectPath, context } = params
  const diagnostics: Diagnostic[] = []

  const schemas = createSchemaCache(context)
  const graph = new MetadataGraph()
  const lineCounters = new Map<string, LineCounter>()

  const baseGraphContext = {
    ...context,
    graph,
  }

  const items = collectItems(projectPath)

  for (const { kind, itemDir, name, yamlPath } of items) {
    const schema = schemas.get(kind)

    // Структурная валидация и проверка форм
    diagnostics.push(...validateItem({ itemDir, schema }))

    // Импорт в граф для проверки ссылок
    try {
      const text = readFileSync(yamlPath, "utf-8")
      const parsed = parseMetadataYaml(text)
      lineCounters.set(yamlPath, parsed.lineCounter)

      const yamlMap = isMap(parsed.doc.contents) ? parsed.doc.contents : undefined

      const importContext = {
        ...baseGraphContext,
        graphContext: {
          filePath: yamlPath,
          currentYamlMap: yamlMap,
        },
      }

      if (kind === "catalog") {
        const model = importMetadataCatalogFromYAML(importContext, parsed.data, name)
        if (model) {
          buildGraphFromModel({
            model: model as unknown as Record<string, unknown>,
            yamlMap,
            rule: MetadataCatalogRules,
            graph,
            parentNodeId: `${MetadataCatalogRules.itemTypePrefix}.${name}`,
            filePath: yamlPath,
          })
        }
      } else if (kind === "document") {
        const model = importMetadataDocumentFromYAML(importContext, parsed.data, name)
        if (model) {
          buildGraphFromModel({
            model: model as unknown as Record<string, unknown>,
            yamlMap,
            rule: MetadataDocumentRules,
            graph,
            parentNodeId: `${MetadataDocumentRules.itemTypePrefix}.${name}`,
            filePath: yamlPath,
          })
        }
      } else {
        const model = importMetadataEnumerationFromYAML(importContext, parsed.data, name)
        if (model) {
          buildGraphFromModel({
            model: model as unknown as Record<string, unknown>,
            yamlMap,
            rule: MetadataEnumerationRules,
            graph,
            parentNodeId: `${MetadataEnumerationRules.itemTypePrefix}.${name}`,
            filePath: yamlPath,
          })
        }
      }
    } catch {
      // Ошибки импорта (например, из-за синтаксических ошибок YAML) не блокируют остальные проверки
    }
  }

  // Проверка битых ссылок через граф
  const brokenRefs = graph.getBrokenReferences()
  if (brokenRefs.size > 0) {
    const brokenStubIds = new Set(brokenRefs.keys())

    for (const nodeId of graph.nodes()) {
      const attrs = graph.getNodeAttributes(nodeId)
      for (const edgeId of graph.outEdges(nodeId)) {
        if (graph.getEdgeAttribute(edgeId, "kind") === "reference") {
          const targetId = graph.target(edgeId)
          if (brokenStubIds.has(targetId)) {
            const filePath = attrs.filePath ?? ""
            let line = 1
            let col = 1

            const edgePositionFrom = graph.getEdgeAttribute(edgeId, "positionFrom")
            const positionFrom = edgePositionFrom ?? attrs.positionFrom

            if (positionFrom?.offset !== undefined && filePath) {
              const lc = lineCounters.get(filePath)
              if (lc) {
                const pos = lc.linePos(positionFrom.offset)
                line = pos.line
                col = pos.col
              }
            }

            diagnostics.push({
              filePath,
              line,
              col,
              message: `Битая ссылка: ${targetId}`,
              severity: "error",
              source: "reference",
            })
          }
        }
      }
    }
  }

  return diagnostics
}
