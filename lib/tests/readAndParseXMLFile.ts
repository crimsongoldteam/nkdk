import { readFileSync } from "fs"
import { join } from "path"
import { xmlImport } from "~/lib/xml/import/importer"

/**
 * Читает XML файл из каталога tests/fixtures и парсит его
 * @param filePath - путь к файлу относительно tests/fixtures (например, "characteristic/simple.xml")
 * @returns распарсенные данные XML
 */
export const readAndParseXMLFile = <T>(filePath: string): T => {
  const fullPath = join(process.cwd(), "tests/fixtures", filePath)
  const xml = readFileSync(fullPath, "utf-8")
  return xmlImport<T>(xml)
}
