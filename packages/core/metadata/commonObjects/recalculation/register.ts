import fs from "fs"
import { basename, dirname, join } from "path"
import { ConfigurationContext, ConfigurationContextFromXML } from "~/metadata/context/types"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { exportMetadataCollectionToYAMLAsRecord } from "~/metadata/orchestration/metadataCollection/toYAML"
import { exportMetadataItemToXML } from "~/metadata/orchestration/metadataItem/toXML"
import { ExportToXMLFunctionNew, SyncExternalFromXMLFunction, SyncExternalToXMLFunction } from "~/metadata/orchestration/property/fn"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import type { XmlWriteManifest } from "~/metadata/orchestration/xmlWriteManifest"
import { RecalculationRules } from "./rules"
import { Recalculation, RecalculationYAML, Recalculations, RecalculationsYAML } from "./types"

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

const exportRecalculationsToXML: ExportToXMLFunctionNew = ({ context, value, referenceMetadata }) => {
  const items = (value as Recalculations | undefined) ?? (referenceMetadata as Recalculations | undefined)
  if (!items || items.length === 0) return undefined

  return items.map((item) => {
    const exported = exportMetadataItemToXML({
      context,
      data: item,
      referenceData: item,
      rule: RecalculationRules,
    })
    return (exported?.Properties as { Name?: string } | undefined)?.Name ?? item.name
  })
}

registerTypeRule("Recalculations", "exportToXML", exportRecalculationsToXML)

registerTypeRule(
  "Recalculations",
  "importFromYAML",
  (context: ConfigurationContext, _rule: PropertyRule | undefined, data: RecalculationsYAML | undefined) => {
    if (!data) return undefined
    const result = Object.entries(data).map(([name, value]) => ({
      ...importMetadataItemFromYAML({ context, yaml: value as RecalculationYAML, rule: RecalculationRules, name }),
      name,
    })) as Recalculations
    return result.length > 0 ? result : undefined
  }
)

registerTypeRule(
  "Recalculations",
  "exportToYAML",
  (context: ConfigurationContext, _rule: PropertyRule | undefined, data: Recalculations | undefined) =>
    exportMetadataCollectionToYAMLAsRecord({
      context,
      data,
      itemRule: RecalculationRules,
      keyField: "name",
    }) as RecalculationsYAML | undefined
)

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
      fallbackSrc: referenceRecalculationsDir ? join(referenceRecalculationsDir, `${recalculationName}.xml`) : undefined,
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
  const existingSrc = fs.existsSync(src)
    ? src
    : fallbackSrc && fs.existsSync(fallbackSrc)
      ? fallbackSrc
      : undefined
  if (!existingSrc) return
  await fs.promises.mkdir(dirname(dst), { recursive: true })
  await fs.promises.copyFile(existingSrc, dst)
  xmlManifest?.addFile(dst)
}

const getRecalculationNames = (value: unknown): string[] => {
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
