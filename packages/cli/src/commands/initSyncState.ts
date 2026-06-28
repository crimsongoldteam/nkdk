import { initializeXmlSyncState } from "@nakidka/core"

export const initSyncState = async (yamlDir: string, xmlDir: string): Promise<void> => {
  await initializeXmlSyncState({
    yamlDir,
    xmlDir,
  })

  process.stdout.write("Файл .nkdk-sync.yaml обновлён\n")
}
