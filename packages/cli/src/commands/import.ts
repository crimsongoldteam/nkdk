import { syncConfigurationFromXML } from "@nakidka/core"

export const importConfiguration = async (xmlDir: string, yamlDir: string): Promise<void> => {
  const context = {
    defaultLanguage: "ru",
    version: "2.20",
    exportToYAML: { toTyped: false },
    fromXML: { forReference: false },
  }
  await syncConfigurationFromXML({ context, inputDir: xmlDir, outputDir: yamlDir })
}
