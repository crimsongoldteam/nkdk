import { initializeXmlSyncState } from "@nakidka/core"

export const initSyncState = async (yamlDir: string, xmlDir: string): Promise<void> => {
  await initializeXmlSyncState({
    yamlDir,
    xmlDir,
    context: {
      defaultLanguage: "ru",
      version: "2.20",
      exportToYAML: { toTyped: false },
      fromXML: { forReference: false },
    },
  })

  process.stdout.write("Файл .nkdk-sync.yaml обновлён\n")
}
