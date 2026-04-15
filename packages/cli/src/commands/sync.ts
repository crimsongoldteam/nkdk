import { syncConfigurationToXML } from "@nakidka/core"

export const syncConfiguration = async (yamlDir: string, xmlDir: string): Promise<void> => {
  const context = {
    defaultLanguage: "ru",
    version: "2.20",
    exportToYAML: { toTyped: false },
    exportToXML: {
      itemsTree: [],
      configDumpInfo: new Map(),
      version: "2.20",
      context: {
        forms: [],
        templates: [],
        parentName: "",
        metadataForNumbering: [],
      },
    },
  }
  await syncConfigurationToXML({ context, inputDir: yamlDir, outputDir: xmlDir })
}
