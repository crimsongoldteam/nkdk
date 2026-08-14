import type { MetadataWorkerManifest } from "@nkdk/runtime"

function resolveWorker(specifier: string): URL {
  return new URL(import.meta.resolve(specifier))
}

export function createMetadataWorkerManifest(baseUrl: string | URL): MetadataWorkerManifest {
  if (new URL(baseUrl).pathname.endsWith(".ts")) {
    return {
      preparedYamlProject: resolveWorker("@nkdk/rules/workers/prepared-yaml"),
      importFromXml: resolveWorker("@nkdk/rules/workers/import"),
      fullSyncToXml: resolveWorker("@nkdk/rules/workers/sync"),
      generic: resolveWorker("@nkdk/rules/workers/generic"),
    }
  }

  return {
    preparedYamlProject: new URL("./preparedYamlProjectWorker.js", baseUrl),
    importFromXml: new URL("./importFromXmlWorker.js", baseUrl),
    fullSyncToXml: new URL("./fullSyncToXmlWorker.js", baseUrl),
    generic: new URL("./worker.js", baseUrl),
  }
}
