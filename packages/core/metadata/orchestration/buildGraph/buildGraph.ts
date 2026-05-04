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
import type {
  FileGraphData,
  ImportContext,
  ProjectGraphInput,
  ProjectGraphSource,
} from "./types"

const normalizeGraphSources = (input: ProjectGraphInput): ProjectGraphSource[] => {
  if (input instanceof Map) {
    return Array.from(input.entries()).map(([filePath, text]) => ({ filePath, text }))
  }
  return [...input]
}

const applySourceStats = (
  files: FileGraphData[],
  sources: readonly ProjectGraphSource[],
): FileGraphData[] => {
  const statsByPath = new Map<string, ProjectGraphSource["fileStats"]>()
  for (const source of sources) {
    statsByPath.set(source.filePath, source.fileStats)
    if (source.pairedText) {
      statsByPath.set(source.pairedText.filePath, source.pairedText.fileStats)
    }
  }
  return files.map((file) => {
    const fileStats = statsByPath.get(file.filePath)
    return fileStats ? { ...file, fileStats } : file
  })
}

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
export async function buildGraph(
  projectFiles: ProjectGraphInput,
  context: ImportContext,
): Promise<FileGraphData[]> {
  const sources = normalizeGraphSources(projectFiles)
  const graph = new GraphBuilder()
  const importContext: ConfigurationContext = context as ConfigurationContext

  // 1. Сначала прикладные объекты — они создают корневые узлы для форм.
  const formEntries: Array<{
    filePath: string
    yaml: string
    ownerNodeId: string
    name: string
    pairedText?: ProjectGraphSource["pairedText"]
  }> = []

  for (const source of sources) {
    const parsed = parseFilePath(source.filePath)
    if (!parsed) continue

    if (parsed.kind === "form") {
      formEntries.push({
        filePath: source.filePath,
        yaml: source.text,
        ownerNodeId: parsed.ownerNodeId,
        name: parsed.formName,
        pairedText: source.pairedText,
      })
      continue
    }

    try {
      await importMetadataFileWithGraph({
        filePath: source.filePath,
        sources: { yaml: source.text },
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
  for (const { filePath, yaml, ownerNodeId, name, pairedText } of formEntries) {
    try {
      await importMetadataFileWithGraph({
        filePath,
        sources: { yaml, nkdk: pairedText?.text },
        kind: "form",
        name,
        graph,
        context: importContext,
        ownerNodeId,
        nkdkFilePath: pairedText?.filePath,
      })
    } catch {
      // Молчаливо пропускаем.
    }
  }

  return applySourceStats(walkGraphToFileData(graph), sources)
}

export interface ParsedItemPath {
  kind: MetadataKind
  name: string
}

export interface ParsedFormPath {
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

export function parseFilePath(filePath: string): ParsedItemPath | ParsedFormPath | undefined {
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
