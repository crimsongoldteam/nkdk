import type { MetadataWorkerManifest } from "@nkdk/core"

export function createMetadataWorkerManifest(baseUrl: string | URL): MetadataWorkerManifest {
  return {
    preparedYamlProject: new URL("./preparedYamlProjectWorker.js", baseUrl),
    importFromXml: new URL("./importFromXmlWorker.js", baseUrl),
    fullSyncToXml: new URL("./fullSyncToXmlWorker.js", baseUrl),
    generic: new URL("./worker.js", baseUrl),
  }
}
