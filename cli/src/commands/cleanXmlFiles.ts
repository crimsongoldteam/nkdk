import * as cliProgress from "cli-progress"
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs"
import { dirname, join, relative } from "path"
import { prepareFormXml } from "../core/cleanXml/cleanFormXml.js"
import { cleanXml } from "../core/cleanXml/cleanXml.js"

function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

function isFile(path: string): boolean {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

function cleanXmlFile(inputFile: string, outputFile: string): void {
  const xmlContent = readFileSync(inputFile, "utf-8")
  const fileName = inputFile.split(/[/\\]/).pop() || ""
  // Автоматически определяем Form.xml и обрабатываем через prepareFormXml
  const processedXml = fileName === "Form.xml" ? prepareFormXml(xmlContent) : cleanXml(xmlContent)
  const outputDir = dirname(outputFile)
  mkdirSync(outputDir, { recursive: true })
  writeFileSync(outputFile, processedXml, "utf-8")
}

function collectXmlFiles(dir: string, baseDir: string = dir): Array<{ input: string; output: string }> {
  const files: Array<{ input: string; output: string }> = []
  const entries = readdirSync(dir, { withFileTypes: true })
  const excludedFiles = ["Template.xml"]

  for (const entry of entries) {
    const entryPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...collectXmlFiles(entryPath, baseDir))
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".xml")) {
      if (excludedFiles.includes(entry.name)) {
        continue
      }
      const relativePath = relative(baseDir, entryPath)
      files.push({
        input: entryPath,
        output: relativePath,
      })
    }
  }

  return files
}

function processDirectory(inputDir: string, outputDir: string): void {
  mkdirSync(outputDir, { recursive: true })
  const xmlFiles = collectXmlFiles(inputDir, inputDir)

  if (xmlFiles.length === 0) {
    console.log("XML файлы не найдены")
    return
  }

  const progressBar = new cliProgress.SingleBar(
    {
      format: "Обработка |{bar}| {percentage}% | {value}/{total} файлов | {file}",
      barCompleteChar: "\u2588",
      barIncompleteChar: "\u2591",
      hideCursor: true,
    },
    cliProgress.Presets.shades_classic
  )

  progressBar.start(xmlFiles.length, 0, { file: "" })

  const errors: Array<{ file: string; error: string }> = []
  let processedCount = 0

  try {
    for (let i = 0; i < xmlFiles.length; i++) {
      const file = xmlFiles[i]
      const outputFile = join(outputDir, file.output)
      const fileName = file.input.split(/[/\\]/).pop() || file.input

      try {
        cleanXmlFile(file.input, outputFile)
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
        errors.push({ file: file.input, error: errorMessage })
      }

      progressBar.update(i + 1, { file: fileName })
    }
  } finally {
    progressBar.stop()
  }

  console.log("")
  if (errors.length > 0) {
    console.log(`⚠  Обработано: ${processedCount}/${xmlFiles.length} файлов`)
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
    console.log(`✓ Успешно обработано: ${processedCount}/${xmlFiles.length} файлов`)
  }
}

export function cleanXmlFiles(inputPath: string, outputPath: string): void {
  try {
    if (isFile(inputPath)) {
      const progressBar = new cliProgress.SingleBar(
        {
          format: "Обработка |{bar}| {percentage}% | {file}",
          barCompleteChar: "\u2588",
          barIncompleteChar: "\u2591",
          hideCursor: true,
        },
        cliProgress.Presets.shades_classic
      )

      const fileName = inputPath.split(/[/\\]/).pop() || inputPath
      progressBar.start(1, 0, { file: fileName })

      try {
        if (isDirectory(outputPath)) {
          const outputFile = join(outputPath, fileName)
          cleanXmlFile(inputPath, outputFile)
        } else {
          cleanXmlFile(inputPath, outputPath)
        }
        progressBar.update(1, { file: fileName })
      } finally {
        progressBar.stop()
        console.log(`✓ ${inputPath} -> ${isDirectory(outputPath) ? join(outputPath, fileName) : outputPath}`)
      }
    } else if (isDirectory(inputPath)) {
      if (!isDirectory(outputPath)) {
        mkdirSync(outputPath, { recursive: true })
      }
      processDirectory(inputPath, outputPath)
      console.log(`\n✓ Обработка завершена: ${inputPath} -> ${outputPath}`)
    } else {
      console.error(`Ошибка: ${inputPath} не является файлом или каталогом`)
      process.exit(1)
    }
  } catch (error) {
    console.error("Ошибка при обработке:", error)
    process.exit(1)
  }
}
