import { XMLBuilder, XMLParser } from "fast-xml-parser"
import { readdir, readFile, writeFile } from "fs/promises"
import { join } from "path"

// Путь к директории фикстур относительно корня проекта
// Скрипт должен запускаться из корня проекта или из packages/core
const FIXTURES_DIR = join(process.cwd(), "tests", "fixtures", "forms")

/**
 * Парсит XML файл с сохранением структуры
 */
function parseXml(xmlContent: string): any {
  const parser = new XMLParser({
    preserveOrder: false,
    ignoreAttributes: false,
    attributeNamePrefix: "",
    attributesGroupName: "@attributes",
    textNodeName: "#text",
    trimValues: true,
    parseTagValue: true,
    parseAttributeValue: false,
    processEntities: true,
    ignoreDeclaration: false,
    ignorePiTags: false,
  })

  try {
    return parser.parse(xmlContent)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Ошибка парсинга XML: ${errorMessage}`)
  }
}

/**
 * Строит XML из объекта с сохранением форматирования
 */
function buildXml(parsedData: any, hasDeclaration: boolean): string {
  const builder = new XMLBuilder({
    preserveOrder: false,
    ignoreAttributes: false,
    attributeNamePrefix: "",
    attributesGroupName: "@attributes",
    textNodeName: "#text",
    format: true,
    suppressEmptyNode: true,
    suppressBooleanAttributes: false,
    indentBy: "\t",
    processEntities: false,
  })

  // @ts-ignore
  builder.options.attributesGroupName = "@attributes"

  const outputXml = builder.build(parsedData)

  // Не добавляем декларацию, если её не было в исходном файле
  if (!hasDeclaration) {
    // Убираем декларацию, если она была добавлена builder'ом
    const withoutDeclaration = outputXml.trim().startsWith("<?xml")
      ? outputXml.trim().replace(/^<\?xml[^>]*>\s*/i, "")
      : outputXml.trim()
    return withoutDeclaration
  }

  return outputXml.trimEnd()
}

/**
 * Перенумеровывает id в объекте, обходя элементы в порядке depth-first
 */
function renumberIds(obj: any): any {
  let idCounter = 1

  function processElement(element: any): any {
    if (element === null || element === undefined || typeof element !== "object") {
      return element
    }

    if (Array.isArray(element)) {
      return element.map((item) => processElement(item))
    }

    const result: any = {}

    // Обрабатываем атрибуты
    if (element["@attributes"]) {
      const attrs = { ...element["@attributes"] }
      // Если id существует и не равен "-1", перенумеровываем
      if (attrs.id !== undefined && attrs.id !== "-1") {
        attrs.id = String(idCounter++)
      }
      result["@attributes"] = attrs
    }

    // Рекурсивно обрабатываем все свойства (depth-first обход)
    for (const key of Object.keys(element)) {
      if (key === "@attributes") {
        continue
      }

      if (key === "#text") {
        result[key] = element[key]
        continue
      }

      const value = element[key]
      if (value !== null && value !== undefined) {
        const processed = processElement(value)
        if (processed !== undefined) {
          result[key] = processed
        }
      }
    }

    return Object.keys(result).length > 0 ? result : element
  }

  return processElement(obj)
}

/**
 * Обрабатывает один XML файл
 */
async function processXmlFile(filePath: string): Promise<void> {
  const content = await readFile(filePath, "utf-8")
  const hasDeclaration = content.trim().startsWith("<?xml")

  const parsed = parseXml(content)
  const renumbered = renumberIds(parsed)
  let newContent = buildXml(renumbered, hasDeclaration)

  // Убираем последнюю пустую строку, если она есть
  // Сначала проверяем \r\n (Windows), потом \n (Unix)
  if (newContent.endsWith("\r\n")) {
    newContent = newContent.slice(0, -2)
  } else if (newContent.endsWith("\n")) {
    newContent = newContent.slice(0, -1)
  }

  await writeFile(filePath, newContent, "utf-8")
  console.log(`✓ Обработан: ${filePath}`)
}

/**
 * Рекурсивно находит все XML файлы в директории
 */
async function findXmlFiles(dir: string): Promise<string[]> {
  const files: string[] = []
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await findXmlFiles(fullPath)))
    } else if (entry.isFile() && entry.name.endsWith(".xml")) {
      files.push(fullPath)
    }
  }

  return files
}

/**
 * Главная функция
 */
async function main() {
  try {
    console.log(`Поиск XML файлов в ${FIXTURES_DIR}...`)
    const xmlFiles = await findXmlFiles(FIXTURES_DIR)
    console.log(`Найдено ${xmlFiles.length} XML файлов\n`)

    for (const file of xmlFiles) {
      await processXmlFile(file)
    }

    console.log(`\n✓ Все файлы обработаны успешно!`)
  } catch (error) {
    console.error("Ошибка:", error)
    process.exit(1)
  }
}

main()
