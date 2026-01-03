import {
  exportMetadataCatalogToXML,
  importMetadataCatalogFromEnterprise,
  xmlExport,
  type MetadataCatalogContext,
  type MetadataCatalogEnterprise,
} from "@nakidka/core"
import * as cliProgress from "cli-progress"
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs"
import { basename, dirname, join, relative } from "path"
import { parse } from "yaml"

export const exportCatalog = (inputPath: string, outputPath: string): void => {
  const context = {
    defaultLanguage: "ru",
    testMode: true,
  }

  const yamlContent = readFileSync(inputPath, "utf-8")
  const enterpriseData = parse(yamlContent) as MetadataCatalogEnterprise

  if (!enterpriseData) {
    throw new Error("Не удалось распарсить YAML")
  }

  // Получаем имя каталога из пути к файлу
  // Ожидаем структуру: .../Catalogs/CatalogName/Item.yml
  const catalogDir = basename(dirname(inputPath))
  const catalogName = catalogDir

  const catalogData = importMetadataCatalogFromEnterprise(context, enterpriseData, catalogName)

  if (!catalogData) {
    throw new Error("Не удалось импортировать каталог из Enterprise формата")
  }

  // Создаем контекст для экспорта в XML
  // Формы и шаблоны пока не извлекаем, используем пустые массивы
  const xmlContext: MetadataCatalogContext = {
    ...context,
    context: {
      forms: [],
      templates: [],
      parentName: catalogName,
    },
  }

  const xmlData = exportMetadataCatalogToXML(xmlContext, catalogData)

  if (!xmlData) {
    throw new Error("Не удалось экспортировать каталог в XML")
  }

  const xmlString = xmlExport({ MetaDataObject: xmlData })

  writeFileSync(outputPath, xmlString, "utf-8")
}

/**
 * Ищет все YAML файлы в каталоге inputPath/Catalogs и обрабатывает их через exportCatalog
 * @param inputPath - путь к входящему каталогу
 * @param outputPath - путь к исходящему каталогу
 */
export const exportCatalogsFromDirectory = (inputPath: string, outputPath: string) => {
  const catalogsPath = join(inputPath, "Catalogs")

  if (!existsSync(catalogsPath)) {
    return
  }

  const entries = readdirSync(catalogsPath, { withFileTypes: true })
  const catalogDirs = entries.filter((entry) => entry.isDirectory())

  if (catalogDirs.length === 0) {
    console.log("Каталоги не найдены")
    return
  }

  // Ищем Item.yml файлы в каждом подкаталоге
  const yamlFiles: Array<{ dir: string; path: string }> = []
  for (const dir of catalogDirs) {
    const dirPath = join(catalogsPath, dir.name)
    const itemYmlPath = join(dirPath, "Item.yml")
    if (existsSync(itemYmlPath)) {
      yamlFiles.push({ dir: dir.name, path: itemYmlPath })
    }
  }

  if (yamlFiles.length === 0) {
    console.log("YAML файлы не найдены")
    return
  }

  const progressBar = new cliProgress.SingleBar(
    {
      format: "Экспорт каталогов |{bar}| {percentage}% | {value}/{total} файлов | {file}",
      barCompleteChar: "\u2588",
      barIncompleteChar: "\u2591",
      hideCursor: true,
    },
    cliProgress.Presets.shades_classic
  )

  progressBar.start(yamlFiles.length, 0, { file: "" })

  const errors: Array<{ file: string; error: string }> = []
  let processedCount = 0

  try {
    for (let i = 0; i < yamlFiles.length; i++) {
      const { dir, path: inputFile } = yamlFiles[i]
      const outputFile = join(outputPath, "Catalogs", `${dir}.xml`)
      const fileName = `${dir}/Item.yml`

      try {
        mkdirSync(join(outputPath, "Catalogs"), { recursive: true })
        exportCatalog(inputFile, outputFile)
        processedCount++
      } catch (error) {
        let errorMessage = "Неизвестная ошибка"
        if (error instanceof Error) {
          errorMessage = error.message
          const firstLine = errorMessage.split("\n")[0]
          errorMessage = firstLine.length > 100 ? firstLine.substring(0, 97) + "..." : firstLine
        } else {
          errorMessage = String(error).split("\n")[0]
        }
        errors.push({ file: inputFile, error: errorMessage })
      }

      progressBar.update(i + 1, { file: fileName })
    }
  } finally {
    progressBar.stop()
  }

  console.log("")
  if (errors.length > 0) {
    console.log(`⚠  Обработано: ${processedCount}/${yamlFiles.length} файлов`)
    console.log(`❌ Ошибок: ${errors.length}`)
    console.log("")
    console.log("Файлы с ошибками:")
    errors.forEach((err, index) => {
      const relativePath = relative(process.cwd(), err.file)
      console.log(`  ${index + 1}. ${relativePath}`)
      console.log(`     ${err.error}`)
      if (index < errors.length - 1) {
        console.log("")
      }
    })
  } else {
    console.log(`✓ Успешно обработано: ${processedCount}/${yamlFiles.length} файлов`)
  }
}
