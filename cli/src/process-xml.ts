#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs"
import { processXmlContent } from "./xmlProcessor.js"

// Получаем аргументы командной строки
const args = process.argv.slice(2)

if (args.length < 2) {
  console.error("Использование: process-xml <входной_файл> <выходной_файл>")
  console.error("Или: pnpm --filter @nakidka/cli process-xml <входной_файл> <выходной_файл>")
  process.exit(1)
}

const [inputFile, outputFile] = args

try {
  // Читаем XML файл
  const xmlContent = readFileSync(inputFile, "utf-8")

  // Обрабатываем XML
  const processedXml = processXmlContent(xmlContent)

  // Сохраняем в файл
  writeFileSync(outputFile, processedXml, "utf-8")
  console.log(`XML обработан и сохранен в ${outputFile}`)
} catch (error) {
  console.error("Ошибка при обработке XML:", error)
  process.exit(1)
}
