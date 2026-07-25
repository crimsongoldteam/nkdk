import fs from "fs"
import { basename, dirname, join } from "path"
import type { ConfigurationContextFromXML } from "../../context/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { exportMetadataItemToJSONSchema } from "../../orchestration/metadataItem/toJSONSchema"
import {
  ExportToJSONSchemaFn,
  SyncExternalFromXMLFunction,
  SyncExternalToXMLFunction,
} from "../../orchestration/property/fn"
import { Type } from "typebox"
import type { XmlWriteManifest } from "../../orchestration/xmlWriteManifest"
import { RecalculationRules } from "./rules"
import type { Recalculation } from "./types"

const RECALCULATIONS_XML_DIR = "Recalculations"
const RECALCULATIONS_NKDK_DIR = "Перерасчеты"
const RECALCULATION_NKDK_XML = "Recalculation.xml"

registerTypeRule("Recalculations", "importFromXML", (_context: ConfigurationContextFromXML, _rule, xml) => {
  if (xml === undefined || xml === null) return undefined
  const names = Array.isArray(xml) ? xml : [xml]
  const result = names
    .filter((name): name is string => typeof name === "string" && name.length > 0)
    .map((name) => ({ itemType: RecalculationRules.itemType, name }) as Recalculation)

  return result.length > 0 ? result : undefined
})

registerTypeRule("Recalculations", "importFromXMLToYAML", ({ xml }) => {
  if (xml === undefined || xml === null) return undefined
  const names = (Array.isArray(xml) ? xml : [xml]).filter(
    (name): name is string => typeof name === "string" && name.length > 0
  )
  return names.length === 0 ? undefined : Object.fromEntries(names.map((name) => [name, {}]))
})

registerTypeRule("Recalculations", "yamlToXMLNestedRule", {
  kind: "collection",
  itemRule: RecalculationRules,
  yamlShape: "record",
  keyField: "name",
  mapItemOutput: ({ name }) => name,
})

const exportRecalculationsToJSONSchema: ExportToJSONSchemaFn = ({ context }) =>
  Type.Record(
    Type.String(),
    exportMetadataItemToJSONSchema({
      context,
      rule: RecalculationRules,
    })
  )

registerTypeRule("Recalculations", "exportToJSONSchema", exportRecalculationsToJSONSchema)

export const syncRecalculationsFromXML: SyncExternalFromXMLFunction = async ({ xmlDir, nkdkDir, name }) => {
  const recalculationsDir = join(resolveXmlObjectDir({ xmlDir, name }), RECALCULATIONS_XML_DIR)
  if (!fs.existsSync(recalculationsDir)) return

  const entries = await fs.promises.readdir(recalculationsDir, { withFileTypes: true })
  const recalculationFiles = entries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".xml"))

  for (const file of recalculationFiles) {
    const recalculationName = basename(file.name, ".xml")
    await copyIfExists({
      src: join(recalculationsDir, file.name),
      dst: join(nkdkDir, RECALCULATIONS_NKDK_DIR, recalculationName, RECALCULATION_NKDK_XML),
    })
  }
}

export const syncRecalculationsToXML: SyncExternalToXMLFunction = async ({
  nkdkDir,
  xmlDir,
  name,
  referenceDir,
  referenceName,
  propertyValue,
  referencePropertyValue,
  xmlManifest,
}) => {
  const recalculationNames = getRecalculationNames(propertyValue ?? referencePropertyValue)
  if (recalculationNames.length === 0) return

  const recalculationsDir = join(nkdkDir, RECALCULATIONS_NKDK_DIR)
  const xmlRecalculationsDir = join(resolveXmlObjectDir({ xmlDir, name }), RECALCULATIONS_XML_DIR)
  const referenceRecalculationsDir = referenceDir
    ? join(resolveXmlObjectDir({ xmlDir: referenceDir, name: referenceName ?? name }), RECALCULATIONS_XML_DIR)
    : undefined

  for (const recalculationName of recalculationNames) {
    await copyIfExists({
      src: join(recalculationsDir, recalculationName, RECALCULATION_NKDK_XML),
      fallbackSrc: referenceRecalculationsDir
        ? join(referenceRecalculationsDir, `${recalculationName}.xml`)
        : undefined,
      dst: join(xmlRecalculationsDir, `${recalculationName}.xml`),
      xmlManifest,
    })
  }
}

const resolveXmlObjectDir = (params: { xmlDir: string; name: string }): string => {
  return basename(params.xmlDir) === params.name ? params.xmlDir : join(params.xmlDir, params.name)
}

async function copyIfExists(params: {
  src: string
  fallbackSrc?: string
  dst: string
  xmlManifest?: XmlWriteManifest
}): Promise<void> {
  const { src, fallbackSrc, dst, xmlManifest } = params
  const existingSrc = fs.existsSync(src) ? src : fallbackSrc && fs.existsSync(fallbackSrc) ? fallbackSrc : undefined
  if (!existingSrc) return
  await fs.promises.mkdir(dirname(dst), { recursive: true })
  await fs.promises.copyFile(existingSrc, dst)
  xmlManifest?.addFile(dst)
}

const getRecalculationNames = (value: unknown): string[] => {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return Object.keys(value)
  }
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === "string") return item
      if (item !== null && typeof item === "object" && typeof (item as { name?: unknown }).name === "string") {
        return (item as { name: string }).name
      }
      return undefined
    })
    .filter((item): item is string => item !== undefined && item.length > 0)
}

registerTypeRule("Recalculations", "syncExternalFromXML", syncRecalculationsFromXML)
registerTypeRule("Recalculations", "syncExternalToXML", syncRecalculationsToXML)
