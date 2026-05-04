import { GraphBuilder } from "./internal/GraphBuilder"
import "~/metadata/appliedObjects/metadataCommand/register"
import "~/metadata/commonObjects/сhoiceParameterLinks/graphFromModel"
import "~/metadata/commonObjects/сhoiceParameters/graphFromModel"
import "~/metadata/commonObjects/metadataAttribute/register"
import "~/metadata/commonObjects/metadataTabularSection/register"
import "~/metadata/commonObjects/standardAttributeDescription/registerCollectionRule"
import { importMetadataFileWithGraph } from "~/metadata/orchestration/importMetadataFileWithGraph"
import type { MetadataKind } from "~/metadata/validation/types"
import type { ConfigurationContext } from "~/metadata/context/types"
import { walkGraphToFileData } from "./walkGraphToFileData"
import type { FileGraphData, ImportContext } from "./types"

/**
 * Чистый агрегатор: YAML-файлы → FileGraphData[] для @nakidka/graph.updateGraph.
 *
 * Входной формат: Map<filePath, yamlText>. Определение kind — по сегментам пути:
 *   Справочник/<name>/Свойства.yaml          → catalog
 *   Документ/<name>/Свойства.yaml            → document
 *   Перечисление/<name>/Свойства.yaml        → enumeration
 *   <ownerKind>/<owner>/Формы/<form>/Форма.yaml → form (требует ownerNodeId)
 *
 * Файлы с неизвестным kind молча игнорируются: контракт buildGraph — собрать то,
 * что точно понятно. Решения о неизвестных файлах принимает вызывающая сторона.
 */
export function buildGraph(
  yamlFiles: Map<string, string>,
  context: ImportContext,
): FileGraphData[] {
  const graph = new GraphBuilder()
  const importContext: ConfigurationContext = context as ConfigurationContext

  // 1. Сначала прикладные объекты — они создают корневые узлы для форм.
  const formEntries: Array<{ filePath: string; yaml: string; ownerNodeId: string; name: string }> = []

  for (const [filePath, yamlText] of yamlFiles) {
    const parsed = parseFilePath(filePath)
    if (!parsed) continue

    if (parsed.kind === "form") {
      formEntries.push({
        filePath,
        yaml: yamlText,
        ownerNodeId: parsed.ownerNodeId,
        name: parsed.formName,
      })
      continue
    }

    try {
      importMetadataFileWithGraph({
        filePath,
        sources: { yaml: yamlText },
        kind: parsed.kind,
        name: parsed.name,
        graph,
        context: importContext,
      })
    } catch {
      // Молчаливо пропускаем — контракт buildGraph: собрать что понятно.
    }
  }

  // 2. Затем формы — их корневой узел требует наличия владельца.
  for (const { filePath, yaml, ownerNodeId, name } of formEntries) {
    try {
      importMetadataFileWithGraph({
        filePath,
        sources: { yaml },
        kind: "form",
        name,
        graph,
        context: importContext,
        ownerNodeId,
      })
    } catch {
      // Молчаливо пропускаем.
    }
  }

  return walkGraphToFileData(graph)
}

interface ParsedItemPath {
  kind: MetadataKind
  name: string
}

interface ParsedFormPath {
  kind: "form"
  ownerNodeId: string
  formName: string
}

/**
 * Ключи должны совпадать с `itemTypePrefix` из соответствующих rules.ts —
 * иначе ownerNodeId, собираемый из ownerDir, разойдётся с itemNodeId,
 * который ensureRootNode строит из itemTypePrefix.
 */
const KIND_BY_DIR: Record<string, MetadataKind> = {
  Справочник: "catalog",
  Документ: "document",
  Перечисление: "enumeration",
}

function parseFilePath(filePath: string): ParsedItemPath | ParsedFormPath | undefined {
  const segments = filePath.split("/")
  // <dir>/<name>/Свойства.yaml
  if (segments.length === 3 && segments[2] === "Свойства.yaml") {
    const dir = segments[0]!
    const name = segments[1]!
    const kind = KIND_BY_DIR[dir]
    if (!kind) return undefined
    return { kind, name }
  }
  // <ownerKind>/<owner>/Формы/<formName>/Форма.yaml
  if (segments.length === 5 && segments[2] === "Формы" && segments[4] === "Форма.yaml") {
    const ownerDir = segments[0]!
    const ownerName = segments[1]!
    const formName = segments[3]!
    if (!KIND_BY_DIR[ownerDir]) return undefined
    return {
      kind: "form",
      ownerNodeId: `${ownerDir}.${ownerName}`,
      formName,
    }
  }
  return undefined
}
