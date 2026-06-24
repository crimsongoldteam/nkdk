import fs from "fs"
import { join } from "path"
import { XMLValidator } from "fast-xml-parser"
import type { ConfigurationContext } from "~/metadata/context/types"
import { xmlExport } from "~/xml/export/exporter"
import { importContentFromXML } from "~/xml/import/importer"
import type { StructuralState } from "../configuration/migrations/types"
import type { XmlSyncManifest } from "../configuration/migrations/xmlManifest"
import { buildConfigDumpInfo } from "./build"
import { importConfigDumpInfoFromXML } from "./fromXML"
import { exportConfigDumpInfoToXML } from "./toXML"
import type { ConfigDumpInfo, ConfigDumpInfoXML } from "./types"

const CONFIG_DUMP_INFO_FILE = "ConfigDumpInfo.xml"

export async function syncConfigDumpInfoToXML(params: {
  context: ConfigurationContext
  outputDir: string
  referenceDir?: string
  yamlState: StructuralState
  migrationState: StructuralState
  referencePathByCurrentPath: Map<string, string>
  xmlManifest?: XmlSyncManifest
}): Promise<void> {
  const reference = await readReferenceConfigDumpInfo({
    context: params.context,
    referenceDir: params.referenceDir,
  })
  const idMap = buildConfigDumpInfo({
    reference: reference.idMap,
    collected: params.context.exportToXML?.configDumpInfo ?? new Map(),
    yamlState: params.yamlState,
    migrationState: params.migrationState,
    referencePathByCurrentPath: params.referencePathByCurrentPath,
  })
  const xml = exportConfigDumpInfoToXML({ context: params.context, idMap })
  const outputPath = join(params.outputDir, CONFIG_DUMP_INFO_FILE)
  const content = preserveReferenceLineEndings(xmlExport({ ConfigDumpInfo: xml }), reference.source)

  await fs.promises.mkdir(params.outputDir, { recursive: true })
  await fs.promises.writeFile(outputPath, content, "utf-8")
  params.xmlManifest?.addFile(outputPath)
}

async function readReferenceConfigDumpInfo(params: {
  context: ConfigurationContext
  referenceDir?: string
}): Promise<{ idMap: ConfigDumpInfo; source?: string }> {
  if (!params.referenceDir) return { idMap: new Map() }

  const path = join(params.referenceDir, CONFIG_DUMP_INFO_FILE)
  if (!fs.existsSync(path)) return { idMap: new Map() }

  const source = await fs.promises.readFile(path, "utf-8")
  const validation = XMLValidator.validate(source)
  if (validation !== true) {
    throw new Error(`Некорректный ConfigDumpInfo.xml: ${validation.err.msg}`)
  }

  const parsed = importContentFromXML<{ ConfigDumpInfo: ConfigDumpInfoXML }>(source)
  return { idMap: importConfigDumpInfoFromXML({ context: params.context, xml: parsed.ConfigDumpInfo }), source }
}

function preserveReferenceLineEndings(xml: string, referenceSource: string | undefined): string {
  if (!referenceSource?.includes("\r\n")) return xml
  return xml.replace(/\n/g, "\r\n")
}
