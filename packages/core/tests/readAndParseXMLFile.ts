import { readFileSync } from "fs"
import { join } from "path"
import { importContentFromXML } from "../xml/import/importer"

/**
 * Reads XML file from lib/tests/fixtures directory and parses it
 * @param filePath - path to file relative to lib/tests/fixtures (e.g., "characteristic/simple.xml")
 * @returns parsed XML data
 */
export const readAndParseXMLFile = <T>(filePath: string): T => {
  const fullPath = join(process.cwd(), "/tests/fixtures", filePath)
  const xml = readFileSync(fullPath, "utf-8")
  return importContentFromXML<T>(xml)
}

/**
 * Reads XML file from lib/tests/fixtures directory as a string
 * @param filePath - path to file relative to lib/tests/fixtures (e.g., "typeDescription/stringType.xml")
 * @returns XML file content as a string
 */
export const readXMLFileAsString = (filePath: string): string => {
  const fullPath = join(process.cwd(), "/tests/fixtures", filePath)
  return readFileSync(fullPath, "utf-8")
}

export const getXMLFixturePath = (filePath: string): string => {
  return join(process.cwd(), "/tests/fixtures", filePath)
}
