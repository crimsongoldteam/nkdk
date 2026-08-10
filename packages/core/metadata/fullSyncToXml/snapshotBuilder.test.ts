import { describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "@nkdk/runtime"
import { entity } from "@nkdk/runtime"
import type { ConfigurationSnapshot } from "@nkdk/runtime"
import { buildXmlSyncConfigurationSnapshot } from "./snapshotBuilder"

const previous: ConfigurationSnapshot = {
  specificationVersion: "1.3",
  indexGeneration: 7n,
  componentPath: "cf",
  files: [
    { projectPath: "А.yaml", contentHash: 1n },
    { projectPath: "Б.yaml", contentHash: 2n },
    { projectPath: "Удалён.yaml", contentHash: 3n },
  ],
  entities: [
    entity("СтарыйА", "А.yaml"),
    entity("ОстаётсяБ", "Б.yaml"),
    entity("Удаляется", "Удалён.yaml"),
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
        entities: [entity("НовыйА", "А.yaml"), entity("НовыйВ", "В.yaml")],
      },
    })
    const expected: ConfigurationSnapshot = {
      specificationVersion: "1.3",
      indexGeneration: 8n,
      componentPath: "cf",
      files: [
        { projectPath: "А.yaml", contentHash: 10n },
        { projectPath: "Б.yaml", contentHash: 2n },
        { projectPath: "В.yaml", contentHash: 4n },
      ],
      entities: [
        entity("НовыйА", "А.yaml"),
        entity("НовыйВ", "В.yaml"),
        entity("ОстаётсяБ", "Б.yaml"),
      ],
    }

    expect(result).toEqual(expected)
    expect(encodeConfigurationIndex(result)).toEqual(encodeConfigurationIndex(expected))
  })

  it("удаляет entity текущего файла при пустом заменяющем фрагменте", () => {
    expect(buildXmlSyncConfigurationSnapshot({
      previous,
      currentFiles: previous.files,
      currentLogicalAddresses: [],
      fragmentData: { sourceProjectPaths: ["Б.yaml"], entities: [] },
    }).entities).toEqual([
      entity("СтарыйА", "А.yaml"),
      entity("Удаляется", "Удалён.yaml"),
    ])
  })
})
