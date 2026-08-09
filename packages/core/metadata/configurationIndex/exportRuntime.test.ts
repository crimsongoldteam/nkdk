import { describe, expect, expectTypeOf, it } from "vitest"
import { createConfigurationIndexCollector } from "./collector/writer"
import { encodeConfigurationIndex } from "./encode"
import { createConfigurationIndexExportRuntime } from "./exportRuntime"
import type { CreateConfigurationIndexExportRuntimeOptions } from "./exportRuntime"
import { createConfigurationIndexReader, snapshotConfigurationIndex } from "./sharedSnapshot"
import type { ConfigurationIndexReader } from "./sharedSnapshot"
import type { ConfigurationSnapshot } from "./types"
import { sampleSnapshot, TEST_UUID } from "./testData"

describe("configuration index export runtime", () => {
  it("does not expose generation overrides in the public factory options", () => {
    type HasTargetGeneration = "targetGeneration" extends keyof CreateConfigurationIndexExportRuntimeOptions
      ? true
      : false

    expectTypeOf<HasTargetGeneration>().toEqualTypeOf<false>()
  })

  function createRuntime(
    logicalAddress = "Документ.Заказ",
    source: ConfigurationIndexReader = createReader(sampleSnapshot()),
    referencePathByCurrentPath?: ReadonlyMap<string, string>,
  ) {
    const collector = createConfigurationIndexCollector()
    const runtime = createConfigurationIndexExportRuntime({
      source,
      collector,
      targetProjectPath: "Документы/Заказ.yaml",
      logicalAddress,
      ...(referencePathByCurrentPath === undefined ? {} : { referencePathByCurrentPath }),
    })
    return { collector, runtime }
  }

  it("uses existing identity from source entity and records it in the target collector", () => {
    const { collector, runtime } = createRuntime()

    const value = runtime.identityOrCreate("uuid")

    expect(value).toBe(TEST_UUID)
    expect(collector.fragment("Документы/Заказ.yaml").entities).toEqual([
      {
        logicalAddress: "Документ.Заказ",
        sourceProjectPath: "Документы/Заказ.yaml",
        identities: { uuid: value },
      },
    ])
  })

  it("читает identity по проверенному пути до переименования и записывает по текущему", () => {
    const { collector, runtime } = createRuntime(
      "Документ.НовыйЗаказ",
      createReader(sampleSnapshot()),
      new Map([["Документ.НовыйЗаказ", "Документ.Заказ"]]),
    )

    expect(runtime.identityOrCreate("uuid")).toBe(TEST_UUID)
    expect(collector.fragment("Документы/Заказ.yaml").entities).toEqual([
      expect.objectContaining({ logicalAddress: "Документ.НовыйЗаказ", identities: { uuid: TEST_UUID } }),
    ])
    expect(runtime.xml()).toBeUndefined()
  })

  it("creates deterministic identities and config versions independent of call order", () => {
    const first = createRuntime("Документ.Новый")
    const firstXmlId = first.runtime.identityOrCreate("xmlId")
    const firstUuid = first.runtime.identityOrCreate("uuid")
    const firstVersion = first.runtime.configVersion("Документ.Новый")

    const second = createRuntime("Документ.Новый")
    const secondVersion = second.runtime.configVersion("Документ.Новый")
    const secondUuid = second.runtime.identityOrCreate("uuid")
    const secondXmlId = second.runtime.identityOrCreate("xmlId")

    expect(secondUuid).toBe(firstUuid)
    expect(secondXmlId).toBe(firstXmlId)
    expect(secondVersion).toBe(firstVersion)
    expect(firstUuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    expect(firstXmlId).toMatch(/^[0-9a-f]{32}$/)
    expect(firstVersion).toMatch(/^[0-9a-f]{40}$/)
  })

  it("uses address and kind in deterministic derivation", () => {
    const first = createRuntime("Документ.Новый")
    const second = createRuntime("Документ.Другой")

    expect(first.runtime.identityOrCreate("uuid")).not.toBe(second.runtime.identityOrCreate("uuid"))
    expect(first.runtime.identityOrCreate("uuid")).not.toBe(first.runtime.identityOrCreate("xmlId"))
    expect(first.runtime.configVersion("Документ.Новый")).not.toBe(first.runtime.configVersion("Документ.Другой"))
  })

  it("uses snapshot bytes in deterministic derivation at the same generation", () => {
    const firstSnapshot = sampleSnapshot()
    const secondSnapshot: ConfigurationSnapshot = {
      ...firstSnapshot,
      files: firstSnapshot.files.map((file, index) =>
        index === 0 ? { ...file, contentHash: file.contentHash + 1n } : file
      ),
    }
    const first = createRuntime("Документ.Новый", createReader(firstSnapshot))
    const second = createRuntime("Документ.Новый", createReader(secondSnapshot))

    expect(first.runtime.identityOrCreate("uuid")).not.toBe(second.runtime.identityOrCreate("uuid"))
  })

  it("uses the next indexGeneration separately from identical snapshot bytes", () => {
    const source = createReader(sampleSnapshot())
    const first = createRuntime("Документ.Новый", withIndexGeneration(source, 7n))
    const second = createRuntime("Документ.Новый", withIndexGeneration(source, 8n))

    expect(first.runtime.source.snapshot).toBe(second.runtime.source.snapshot)
    expect(first.runtime.identityOrCreate("uuid")).not.toBe(second.runtime.identityOrCreate("uuid"))
  })

  it("reads identities, XML and omitted children from one source entity", () => {
    const { runtime } = createRuntime()

    expect(runtime.identity("xmlId")).toBe("Order")
    expect(runtime.xml()).toEqual({
      extended: true,
      xsiNil: true,
      explicitEmpty: true,
      xsiType: "xs:string",
      xmlText: "текст",
      xmlPrefix: "xs",
    })
    expect(runtime.omittedChildren()).toEqual({ kind: "names", names: ["Форма", "Макет"] })
  })

  it("uses a separate omitted-children address without changing the item address", () => {
    const { runtime } = createRuntime("Документ.Другой")
    const separated = runtime.withXmlNodeLogicalAddress("Документ.Заказ")

    expect(separated.logicalAddress).toBe("Документ.Другой")
    expect(separated.omittedChildren()).toEqual({ kind: "names", names: ["Форма", "Макет"] })
  })

  it("keeps collector conflicts visible", () => {
    const { collector, runtime } = createRuntime("Документ.Новый")
    collector.setIdentity("Документ.Новый", "uuid", "00000000-0000-4000-8000-000000000099")

    expect(() => runtime.identityOrCreate("uuid")).toThrow("Конфликт logicalAddress")
  })
})

function createReader(snapshot: ConfigurationSnapshot): ConfigurationIndexReader {
  return createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(snapshot)))
}

function withIndexGeneration(source: ConfigurationIndexReader, indexGeneration: bigint): ConfigurationIndexReader {
  return {
    snapshot: source.snapshot,
    header: () => ({ ...source.header(), indexGeneration }),
    file: source.file.bind(source),
    files: source.files.bind(source),
    entity: source.entity.bind(source),
    entities: source.entities.bind(source),
    entitiesBySourceProjectPath: source.entitiesBySourceProjectPath.bind(source),
  }
}
