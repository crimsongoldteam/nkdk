import { readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { importContentFromXML } from "../xml/import/importer"

/**
 * Reads XML from `__fixtures__` рядом с тестовым файлом (по import.meta.url).
 * @param importMetaUrl — `import.meta.url` файла теста
 * @param pathRelativeToFixtures — путь относительно `__fixtures__` (например `"dcs/choiceParameterLinks.xml"`)
 */
export const readXMLFixtureAsString = (importMetaUrl: string, pathRelativeToFixtures: string): string => {
  const dir = dirname(fileURLToPath(importMetaUrl))
  const fullPath = join(dir, "__fixtures__", pathRelativeToFixtures)
  return readFileSync(fullPath, "utf-8")
}

/**
 * Как `readAndParseXMLFile`, но база — `__fixtures__` рядом с тестовым файлом.
 */
export const readAndParseXMLFixture = <T>(importMetaUrl: string, pathRelativeToFixtures: string): T => {
  const xml = readXMLFixtureAsString(importMetaUrl, pathRelativeToFixtures)
  return importContentFromXML<T>(xml)
}
