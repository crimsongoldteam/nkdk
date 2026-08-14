import { describe, expect, it } from "vitest"

import { createMetadataWorkerManifest } from "./metadataWorkerManifest"

describe("createMetadataWorkerManifest", () => {
  it("разрешает публичные TypeScript worker entrypoints в source-режиме", () => {
    const manifest = createMetadataWorkerManifest(
      "file:///workspace/packages/mcp/src/metadataRuntimeHandle.ts",
    )

    expect(manifest.preparedYamlProject.pathname).toMatch(
      /packages\/rules\/metadata\/composition\/workers\/preparedYamlProject\.ts$/u,
    )
    expect(manifest.importFromXml.pathname).toMatch(
      /packages\/rules\/metadata\/composition\/workers\/importFromXml\.ts$/u,
    )
    expect(manifest.fullSyncToXml.pathname).toMatch(
      /packages\/rules\/metadata\/composition\/workers\/fullSyncToXml\.ts$/u,
    )
    expect(manifest.generic.pathname).toMatch(
      /packages\/rules\/metadata\/composition\/workers\/generic\.ts$/u,
    )
  })

  it("сохраняет соседние JavaScript worker-файлы в compiled-режиме", () => {
    const manifest = createMetadataWorkerManifest(
      "file:///workspace/packages/mcp/dist/bin/nkdk-mcp",
    )

    expect(manifest).toEqual({
      preparedYamlProject: new URL("file:///workspace/packages/mcp/dist/bin/preparedYamlProjectWorker.js"),
      importFromXml: new URL("file:///workspace/packages/mcp/dist/bin/importFromXmlWorker.js"),
      fullSyncToXml: new URL("file:///workspace/packages/mcp/dist/bin/fullSyncToXmlWorker.js"),
      generic: new URL("file:///workspace/packages/mcp/dist/bin/worker.js"),
    })
  })
})
