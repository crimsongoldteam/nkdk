import { existsSync, readdirSync, readFileSync } from "fs"
import { join } from "path"
import { LineCounter } from "yaml"
import { ConfigurationContext } from "~/metadata/context/types"
import { importMetadataFileWithGraph } from "~/metadata/orchestration/importMetadataFileWithGraph"
import { isOwning } from "~/metadata/relations/edgeKinds"
import { MetadataGraph } from "~/metadata/relations/MetadataGraph"
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

  const items = collectItems(projectPath)

  for (const { kind, itemDir, name, yamlPath } of items) {
    const schema = schemas.get(kind)

    // Структурная валидация и проверка форм
    diagnostics.push(...validateItem({ itemDir, schema }))

    // Импорт в граф для проверки ссылок
    try {
      const text = readFileSync(yamlPath, "utf-8")
      const result = importMetadataFileWithGraph({ filePath: yamlPath, sources: { yaml: text }, kind, name, graph, context })
      if (result) {
        lineCounters.set(yamlPath, result.parsed.lineCounter)
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
        if (!isOwning(graph.getEdgeAttribute(edgeId, "kind"))) {
          const targetId = graph.target(edgeId)
          if (brokenStubIds.has(targetId)) {
            const filePath = attrs.filePaths?.[0] ?? ""
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
