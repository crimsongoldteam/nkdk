#!/usr/bin/env node
import { Command } from "commander"
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { processXmlContent } from "./xmlProcessor.js"

const program = new Command()

program
  .name("process-xml")
  .description("CLI инструмент для обработки XML файлов и каталогов")
  .version("1.0.0")
  .argument("<input>", "входной файл или каталог")
  .argument("<output>", "выходной файл или каталог")
  .action((inputPath: string, outputPath: string) => {
    processPaths(inputPath, outputPath)
  })

program.parse()

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

function processXmlFile(inputFile: string, outputFile: string): void {
  try {
    // Читаем XML файл
    const xmlContent = readFileSync(inputFile, "utf-8")

    // Обрабатываем XML
    const processedXml = processXmlContent(xmlContent)

    // Создаем директорию для выходного файла, если её нет
    const outputDir = dirname(outputFile)
    mkdirSync(outputDir, { recursive: true })

    // Сохраняем в файл
    writeFileSync(outputFile, processedXml, "utf-8")
    console.log(`✓ ${inputFile} -> ${outputFile}`)
  } catch (error) {
    console.error(`Ошибка при обработке ${inputFile}:`, error)
    throw error
  }
}

function processDirectory(inputDir: string, outputDir: string): void {
  // Создаем выходную директорию, если её нет
  mkdirSync(outputDir, { recursive: true })

  // Получаем все элементы в директории
  const entries = readdirSync(inputDir, { withFileTypes: true })

  for (const entry of entries) {
    const inputEntryPath = join(inputDir, entry.name)
    const outputEntryPath = join(outputDir, entry.name)

    if (entry.isDirectory()) {
      // Рекурсивно обрабатываем подкаталоги
      processDirectory(inputEntryPath, outputEntryPath)
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".xml")) {
      // Обрабатываем XML файлы
      processXmlFile(inputEntryPath, outputEntryPath)
    }
  }
}

function processPaths(inputPath: string, outputPath: string): void {
  try {
    if (isFile(inputPath)) {
      // Обработка одного файла
      if (isDirectory(outputPath)) {
        // Если выходной путь - директория, сохраняем файл с тем же именем
        const fileName = inputPath.split(/[/\\]/).pop() || "output.xml"
        const outputFile = join(outputPath, fileName)
        processXmlFile(inputPath, outputFile)
      } else {
        // Если выходной путь - файл, сохраняем туда
        processXmlFile(inputPath, outputPath)
      }
    } else if (isDirectory(inputPath)) {
      // Обработка каталога
      if (!isDirectory(outputPath)) {
        // Если выходной путь не существует или это файл, создаем директорию
        mkdirSync(outputPath, { recursive: true })
      }
      processDirectory(inputPath, outputPath)
      console.log(`\nОбработка завершена: ${inputPath} -> ${outputPath}`)
    } else {
      console.error(`Ошибка: ${inputPath} не является файлом или каталогом`)
      process.exit(1)
    }
  } catch (error) {
    console.error("Ошибка при обработке:", error)
    process.exit(1)
  }
}
