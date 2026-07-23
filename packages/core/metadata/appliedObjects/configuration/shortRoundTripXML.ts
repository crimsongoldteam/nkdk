import fs from "fs"
import { mkdtemp } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import type { ConfigurationContextFromXML, ConfigurationContextWithExportToXML } from "../../context/types"
import { syncConfigurationFromXML } from "./convertFromXML"
import { syncConfigurationToXML } from "./syncToXML"

const contextFromXML = (): ConfigurationContextFromXML => ({
  defaultLanguage: "ru",
  version: "2.20",
  fromXML: { forReference: false },
  exportToYAML: { toTyped: false },
})

const contextToXML = (): ConfigurationContextWithExportToXML => ({
  defaultLanguage: "ru",
  version: "2.20",
  exportToXML: {
    itemsTree: [],
    configDumpInfo: new Map(),
    version: "2.20",
    context: { forms: [], templates: [], parentName: "", metadataForNumbering: [] },
  },
})

export const shortRoundTripXML = async (params: { inputDir: string; outputDir: string }): Promise<void> => {
  if (!fs.existsSync(params.inputDir)) return

  const yamlDir = await mkdtemp(join(tmpdir(), "nkdk-short-round-trip-"))
  try {
    const imported = await syncConfigurationFromXML({
      context: contextFromXML(),
      inputDir: params.inputDir,
      outputDir: yamlDir,
    })
    if (imported.failed.length > 0) throw new Error(imported.failed[0]?.message ?? "Не удалось импортировать XML")

    const exported = await syncConfigurationToXML({
      context: contextToXML(),
      inputDir: yamlDir,
      outputDir: params.outputDir,
      referenceDir: params.inputDir,
      preserveReferenceChildObjects: true,
    })
    if (exported.failed.length > 0) throw exported.failed[0]?.error ?? new Error("Не удалось экспортировать XML")
  } finally {
    await fs.promises.rm(yamlDir, { recursive: true, force: true })
  }
}
