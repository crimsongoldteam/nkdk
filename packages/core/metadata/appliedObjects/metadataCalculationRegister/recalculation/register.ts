import fs from "fs"
import { basename, dirname, join } from "path"
import type { ConfigurationContextFromXML } from "../../../context/types"
import { definePropertyTypeRule } from "../../../ruleRuntime/property/typeRuleRegistry"
import { exportMetadataItemToJSONSchema } from "../../../ruleRuntime/metadataItem/toJSONSchema"
import { ExportToJSONSchemaFn, SyncExternalFromXMLFunction } from "../../../ruleRuntime/property/fn"
import { Type } from "typebox"
import { RecalculationRules } from "./rules"
import type { Recalculation } from "./types"

const RECALCULATIONS_XML_DIR = "Recalculations"
const RECALCULATIONS_NKDK_DIR = "Перерасчеты"
const RECALCULATION_NKDK_XML = "Recalculation.xml"

export const metadataPropertyRule000 = definePropertyTypeRule("Recalculations", "importFromXML", (_context: ConfigurationContextFromXML, _rule, xml) => {
  if (xml === undefined || xml === null) return undefined
  const names = Array.isArray(xml) ? xml : [xml]
  const result = names
    .filter((name): name is string => typeof name === "string" && name.length > 0)
    .map((name) => ({ itemType: RecalculationRules.itemType, name }) as Recalculation)

  return result.length > 0 ? result : undefined
})

export const metadataPropertyRule001 = definePropertyTypeRule("Recalculations", "importFromXMLToYAML", ({ xml }) => {
  if (xml === undefined || xml === null) return undefined
  const names = (Array.isArray(xml) ? xml : [xml]).filter(
    (name): name is string => typeof name === "string" && name.length > 0
  )
  return names.length === 0 ? undefined : Object.fromEntries(names.map((name) => [name, {}]))
})

export const metadataPropertyRule002 = definePropertyTypeRule("Recalculations", "yamlToXMLNestedRule", {
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

export const metadataPropertyRule003 = definePropertyTypeRule("Recalculations", "exportToJSONSchema", exportRecalculationsToJSONSchema)

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

const resolveXmlObjectDir = (params: { xmlDir: string; name: string }): string => {
  return basename(params.xmlDir) === params.name ? params.xmlDir : join(params.xmlDir, params.name)
}

async function copyIfExists(params: {
  src: string
  dst: string
}): Promise<void> {
  const { src, dst } = params
  if (!fs.existsSync(src)) return
  await fs.promises.mkdir(dirname(dst), { recursive: true })
  await fs.promises.copyFile(src, dst)
}

export const metadataPropertyRule004 = definePropertyTypeRule("Recalculations", "syncExternalFromXML", syncRecalculationsFromXML)
