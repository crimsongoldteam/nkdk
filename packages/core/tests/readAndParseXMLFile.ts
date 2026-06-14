import { readFileSync } from "fs"
import { join } from "path"
import { importContentFromXML } from "../xml/import/importer"

const fixturesRoot = join(__dirname, "fixtures")
const movedFixtures = [
  ["forms/commandSet", "../metadata/forms/commonObjects/commandSet/__fixtures__"],
  ["forms/events", "../metadata/forms/commonObjects/event/__fixtures__"],
  ["sync/syncConfiguration", "../metadata/appliedObjects/configuration/__fixtures__/syncConfiguration"],
  ["border", "../metadata/commonObjects/border/__fixtures__"],
  ["childItems", "../metadata/forms/commonObjects/childItems/__fixtures__"],
  ["choiceList", "../metadata/commonObjects/choiceList/__fixtures__"],
  ["color", "../metadata/commonObjects/color/__fixtures__"],
  ["configDumpInfo", "../metadata/appliedObjects/configDumpInfo/__fixtures__"],
  ["configuration", "../metadata/appliedObjects/configuration/__fixtures__"],
  ["fieldsList", "../metadata/commonObjects/fieldsList/__fixtures__"],
  ["formAttributes", "../metadata/forms/commonObjects/formAttribute/__fixtures__/legacy"],
  ["internalInfo", "../metadata/commonObjects/internalInfo/__fixtures__"],
  ["metadataAttribute", "../metadata/commonObjects/metadataAttribute/__fixtures__/legacy"],
  ["metadataTabularSection", "../metadata/commonObjects/metadataTabularSection/__fixtures__/legacy"],
  ["metadataObjectRefCollection", "../metadata/commonObjects/metadataObjectRefCollection/__fixtures__"],
  ["picture", "../metadata/commonObjects/picture/__fixtures__"],
  ["userVisible", "../metadata/commonObjects/userVisible/__fixtures__"],
] as const

const resolveFixturePath = (filePath: string, baseDir?: string): string => {
  if (baseDir) return join(baseDir, filePath)

  const normalizedPath = filePath.replace(/^\/+/, "")
  const match = movedFixtures.find(([prefix]) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`))
  if (!match) return join(fixturesRoot, normalizedPath)

  const [prefix, targetDir] = match
  const relativePath = normalizedPath === prefix ? "" : normalizedPath.slice(prefix.length + 1)
  return join(__dirname, targetDir, relativePath)
}

/**
 * Reads XML file from a moved fixture namespace or from `baseDir` and parses it
 * @param filePath - path to file relative to a fixture namespace (e.g., "color/absolute.xml")
 * @param baseDir - optional directory containing the file (e.g., `__fixtures__` next to a test)
 * @returns parsed XML data
 */
export const readAndParseXMLFile = <T>(filePath: string, baseDir?: string): T => {
  const fullPath = resolveFixturePath(filePath, baseDir)
  const xml = readFileSync(fullPath, "utf-8")
  return importContentFromXML<T>(xml)
}

/**
 * Reads XML file from a moved fixture namespace or from `baseDir` as a string
 * @param filePath - path to file relative to base directory (e.g., "typeDescription/stringType.xml")
 * @param baseDir - optional directory containing the file
 * @returns XML file content as a string
 */
export const readXMLFileAsString = (filePath: string, baseDir?: string): string => {
  const fullPath = resolveFixturePath(filePath, baseDir)
  return readFileSync(fullPath, "utf-8")
}

export const getXMLFixturePath = (filePath: string): string => {
  return resolveFixturePath(filePath)
}
