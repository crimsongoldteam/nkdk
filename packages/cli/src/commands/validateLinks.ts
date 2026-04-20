import chalk from "chalk"
import { existsSync, readdirSync, readFileSync } from "fs"
import { join, relative } from "path"
import { isMap, LineCounter } from "yaml"
import { importMetadataCatalogFromYAML } from "~/metadata/appliedObjects/metadataCatalog/fromYAML"
import { importMetadataDocumentFromYAML } from "~/metadata/appliedObjects/metadataDocument/fromYAML"
import { importMetadataEnumerationFromYAML } from "~/metadata/appliedObjects/metadataEnumeration/fromYAML"
import { MetadataGraph } from "~/metadata/relations/MetadataGraph"
import { parseMetadataYaml } from "~/yaml/parseMetadataYaml"

export const validateLinks = (projectPath: string): void => {
  if (!existsSync(projectPath)) {
    console.error(chalk.red(`Директория не найдена: ${projectPath}`))
    process.exit(1)
  }

  const graph = new MetadataGraph()
  const baseContext = {
    version: "2.20",
    defaultLanguage: "ru",
    graph,
  }

  let importedCount = 0
  const lineCounters = new Map<string, LineCounter>()

  // Импорт справочников (Справочник/ИмяСправочника/Свойства.yml)
  const catalogsPath = join(projectPath, "Справочник")
  if (existsSync(catalogsPath)) {
    const entries = readdirSync(catalogsPath, { withFileTypes: true })
    for (const dir of entries.filter((e) => e.isDirectory())) {
      const yamlPath = join(catalogsPath, dir.name, "Свойства.yml")
      if (!existsSync(yamlPath)) continue

      try {
        const text = readFileSync(yamlPath, "utf-8")
        const parsed = parseMetadataYaml(text)
        lineCounters.set(yamlPath, parsed.lineCounter)
        importMetadataCatalogFromYAML(
          {
            ...baseContext,
            graphContext: {
              filePath: yamlPath,
              currentYamlMap: isMap(parsed.doc.contents) ? parsed.doc.contents : undefined,
            },
          },
          parsed.data,
          dir.name,
        )
        importedCount++
      } catch (err) {
        console.warn(chalk.yellow(`Предупреждение: не удалось импортировать ${yamlPath}: ${err}`))
      }
    }
  }

  // Импорт документов (Документ/ИмяДокумента/Свойства.yml)
  const documentsPath = join(projectPath, "Документ")
  if (existsSync(documentsPath)) {
    const entries = readdirSync(documentsPath, { withFileTypes: true })
    for (const dir of entries.filter((e) => e.isDirectory())) {
      const yamlPath = join(documentsPath, dir.name, "Свойства.yml")
      if (!existsSync(yamlPath)) continue

      try {
        const text = readFileSync(yamlPath, "utf-8")
        const parsed = parseMetadataYaml(text)
        lineCounters.set(yamlPath, parsed.lineCounter)
        importMetadataDocumentFromYAML(
          {
            ...baseContext,
            graphContext: {
              filePath: yamlPath,
              currentYamlMap: isMap(parsed.doc.contents) ? parsed.doc.contents : undefined,
            },
          },
          parsed.data,
          dir.name,
        )
        importedCount++
      } catch (err) {
        console.warn(chalk.yellow(`Предупреждение: не удалось импортировать ${yamlPath}: ${err}`))
      }
    }
  }

  // Импорт перечислений (Перечисление/ИмяПеречисления/Свойства.yml)
  const enumerationsPath = join(projectPath, "Перечисление")
  if (existsSync(enumerationsPath)) {
    const entries = readdirSync(enumerationsPath, { withFileTypes: true })
    for (const dir of entries.filter((e) => e.isDirectory())) {
      const yamlPath = join(enumerationsPath, dir.name, "Свойства.yml")
      if (!existsSync(yamlPath)) continue

      try {
        const text = readFileSync(yamlPath, "utf-8")
        const parsed = parseMetadataYaml(text)
        lineCounters.set(yamlPath, parsed.lineCounter)
        importMetadataEnumerationFromYAML(
          {
            ...baseContext,
            graphContext: {
              filePath: yamlPath,
              currentYamlMap: isMap(parsed.doc.contents) ? parsed.doc.contents : undefined,
            },
          },
          parsed.data,
          dir.name,
        )
        importedCount++
      } catch (err) {
        console.warn(chalk.yellow(`Предупреждение: не удалось импортировать ${yamlPath}: ${err}`))
      }
    }
  }

  console.log(`Импортировано объектов: ${importedCount}`)

  const brokenRefs = graph.getBrokenReferences()

  if (brokenRefs.size === 0) {
    console.log(chalk.green("Битых ссылок не обнаружено"))
    return
  }

  // Найти исходные узлы (с позицией в файле) для каждой битой ссылки
  const brokenStubIds = new Set(brokenRefs.keys())
  const issues: Array<{
    filePath: string
    offset: number | undefined
    targetId: string
    sourceId: string
  }> = []

  for (const nodeId of graph.nodes()) {
    const attrs = graph.getNodeAttributes(nodeId)
    for (const edgeId of graph.outEdges(nodeId)) {
      if (graph.getEdgeAttribute(edgeId, "kind") === "reference") {
        const targetId = graph.target(edgeId)
        if (brokenStubIds.has(targetId)) {
          issues.push({
            filePath: attrs.filePath ?? "",
            offset: attrs.positionFrom?.offset,
            targetId,
            sourceId: nodeId,
          })
        }
      }
    }
  }

  console.error(chalk.red(`\nОбнаружено битых ссылок: ${issues.length}\n`))

  for (const issue of issues) {
    const displayPath = issue.filePath ? relative(projectPath, issue.filePath) : "(неизвестный файл)"
    let pos = ""
    if (issue.offset !== undefined && issue.filePath) {
      const lc = lineCounters.get(issue.filePath)?.linePos(issue.offset)
      pos = lc ? `:${lc.line}:${lc.col}` : `:${issue.offset}`
    }
    console.error(`  ${chalk.cyan(displayPath)}${chalk.gray(pos)} — ${chalk.red(issue.targetId)}`)
  }

  process.exit(1)
}
