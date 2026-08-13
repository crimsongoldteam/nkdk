import { describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "@nkdk/runtime"
import type { ConfigurationSnapshot } from "@nkdk/runtime"
import { buildXmlSyncConfigurationSnapshot } from "./snapshotBuilder"

const previous: ConfigurationSnapshot = {
  specificationVersion: "1.4",
  indexGeneration: 7n,
  componentPath: "cf",
  files: [
    { projectPath: "А.yaml", contentHash: 1n },
    { projectPath: "Б.yaml", contentHash: 2n },
    { projectPath: "Удалён.yaml", contentHash: 3n },
  ],
  entities: [
    indexEntity("СтарыйА", "А.yaml"),
    indexEntity("ОстаётсяБ", "Б.yaml"),
    indexEntity("Удаляется", "Удалён.yaml"),
  ],
}

describe("buildXmlSyncConfigurationSnapshot", () => {
  it("сливает изменённые задания и сохраняет только актуальные неизменённые entity", () => {
    const result = buildXmlSyncConfigurationSnapshot({
      previous,
      currentFiles: [
        { projectPath: "А.yaml", contentHash: 10n },
        { projectPath: "Б.yaml", contentHash: 2n },
        { projectPath: "В.yaml", contentHash: 4n },
      ],
      currentLogicalAddresses: [
        { logicalAddress: "НовыйА", sourceProjectPath: "А.yaml" },
        { logicalAddress: "ОстаётсяБ", sourceProjectPath: "Б.yaml" },
        { logicalAddress: "НовыйВ", sourceProjectPath: "В.yaml" },
      ],
      fragmentData: {
        sourceProjectPaths: ["А.yaml", "В.yaml"],
        entities: [
          {
            logicalAddress: "НовыйА",
            sourceProjectPath: "А.yaml",
            identities: { uuid: "00000000-0000-4000-8000-000000000001", xmlId: "Catalog42" },
          },
          indexEntity("НовыйВ", "В.yaml"),
        ],
      },
    })
    const expected: ConfigurationSnapshot = {
      specificationVersion: "1.4",
      indexGeneration: 8n,
      componentPath: "cf",
      files: [
        { projectPath: "А.yaml", contentHash: 10n },
        { projectPath: "Б.yaml", contentHash: 2n },
        { projectPath: "В.yaml", contentHash: 4n },
      ],
      entities: [
        {
          logicalAddress: "НовыйА",
          sourceProjectPath: "А.yaml",
          identities: { uuid: "00000000-0000-4000-8000-000000000001", xmlId: "Catalog42" },
        },
        indexEntity("НовыйВ", "В.yaml"),
        indexEntity("ОстаётсяБ", "Б.yaml"),
      ],
    }

    expect(result).toEqual(expected)
    expect(encodeConfigurationIndex(result)).toEqual(encodeConfigurationIndex(expected))
    expect(JSON.stringify(result.entities)).not.toMatch(
      /"xmlName"|"present"|"xsiNil"|"explicitEmpty"|"xsiType"|"xmlText"|"xmlPrefix"/u,
    )
  })

  it("удаляет entity текущего файла при пустом заменяющем фрагменте", () => {
    expect(buildXmlSyncConfigurationSnapshot({
      previous,
      currentFiles: previous.files,
      currentLogicalAddresses: [],
      fragmentData: { sourceProjectPaths: ["Б.yaml"], entities: [] },
    }).entities).toEqual([
      indexEntity("СтарыйА", "А.yaml"),
      indexEntity("Удаляется", "Удалён.yaml"),
    ])
  })
})

function indexEntity(logicalAddress: string, sourceProjectPath: string): ConfigurationSnapshot["entities"][number] {
  return { logicalAddress, sourceProjectPath, identities: { xmlId: logicalAddress } }
}
