import { readFileSync } from "fs"
import { join } from "path"
import { importContentFromXML } from "../xml/import/importer"

const fixturesRoot = join(__dirname, "fixtures")

/**
 * Reads XML file from lib/tests/fixtures (default) or from `baseDir` and parses it
 * @param filePath - path to file relative to base directory (e.g., "characteristic/simple.xml")
 * @param baseDir - optional directory containing the file (e.g., `__fixtures__` next to a test)
 * @returns parsed XML data
 */
export const readAndParseXMLFile = <T>(filePath: string, baseDir?: string): T => {
  const dir = baseDir ?? fixturesRoot
  const fullPath = join(dir, filePath)
  const xml = readFileSync(fullPath, "utf-8")
  return importContentFromXML<T>(xml)
}

/**
 * Reads XML file from lib/tests/fixtures (default) or from `baseDir` as a string
 * @param filePath - path to file relative to base directory (e.g., "typeDescription/stringType.xml")
 * @param baseDir - optional directory containing the file
 * @returns XML file content as a string
 */
export const readXMLFileAsString = (filePath: string, baseDir?: string): string => {
  const dir = baseDir ?? fixturesRoot
  const fullPath = join(dir, filePath)
  return readFileSync(fullPath, "utf-8")
}

export const getXMLFixturePath = (filePath: string): string => {
  return join(fixturesRoot, filePath)
}
