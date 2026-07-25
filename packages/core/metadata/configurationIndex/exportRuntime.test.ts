import { describe, expect, it } from "vitest"
import { createConfigurationIndexCollector } from "./collector/writer"
import { createConfigurationIndexReader, snapshotConfigurationIndex } from "./sharedSnapshot"
import { sampleIndex } from "./testData"
import { encodeConfigurationIndex } from "./encode"
import { createConfigurationIndexExportRuntime } from "./exportRuntime"

describe("configuration index export runtime", () => {
  function createRuntime(logicalAddress = "Справочник.Товары") {
    const collector = createConfigurationIndexCollector()
    const source = createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(sampleIndex())))
    const runtime = createConfigurationIndexExportRuntime({
      source,
      collector,
      targetProjectPath: "Справочник/Товары/Свойства.yaml",
      logicalAddress,
    })
    return { collector, runtime }
  }

  it("uses existing identity from source index and records it in the target collector", () => {
    const { collector, runtime } = createRuntime()

    const value = runtime.identityOrCreate("uuid")

    expect(value).toBe("00000000-0000-4000-8000-000000000001")
    expect(collector.fragment("Справочник/Товары/Свойства.yaml").identities).toEqual([
      { logicalAddress: "Справочник.Товары", kind: "uuid", value },
    ])
  })

  it("creates deterministic identities and config versions independent of call order", () => {
    const first = createRuntime("Справочник.Новый")
    const firstXmlId = first.runtime.identityOrCreate("xmlId")
    const firstUuid = first.runtime.identityOrCreate("uuid")
    const firstVersion = first.runtime.configVersion("Справочник.Новый")

    const second = createRuntime("Справочник.Новый")
    const secondVersion = second.runtime.configVersion("Справочник.Новый")
    const secondUuid = second.runtime.identityOrCreate("uuid")
    const secondXmlId = second.runtime.identityOrCreate("xmlId")

    expect(secondUuid).toBe(firstUuid)
    expect(secondXmlId).toBe(firstXmlId)
    expect(secondVersion).toBe(firstVersion)
    expect(firstUuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    expect(firstXmlId).toMatch(/^[0-9a-f]{32}$/)
    expect(firstVersion).toMatch(/^[0-9a-f]{40}$/)
  })

  it("uses logical address and identity kind in deterministic derivation", () => {
    const first = createRuntime("Справочник.Новый")
    const second = createRuntime("Справочник.Другой")

    expect(first.runtime.identityOrCreate("uuid")).not.toBe(second.runtime.identityOrCreate("uuid"))
    expect(first.runtime.identityOrCreate("uuid")).not.toBe(first.runtime.identityOrCreate("xmlId"))
    expect(first.runtime.configVersion("Справочник.Новый")).not.toBe(first.runtime.configVersion("Справочник.Другой"))
  })

  it("reads XML node and value from source index", () => {
    const { runtime } = createRuntime()

    expect(runtime.xmlNode()).toEqual({
      logicalAddress: "Справочник.Товары",
      order: ["name", "synonym"],
      aliases: { synonym: "Synonym" },
      present: ["name"],
    })
    expect(runtime.xmlValue("Справочник.Товары.synonym")).toEqual({
      logicalAddress: "Справочник.Товары.synonym",
      explicitEmpty: true,
      xmlText: "",
    })
  })

  it("uses a separate XML-node address without changing the item address", () => {
    const { runtime } = createRuntime("Справочник.Другой")
    const separated = runtime.withXmlNodeLogicalAddress("Справочник.Товары")

    expect(separated.logicalAddress).toBe("Справочник.Другой")
    expect(separated.xmlNode()).toEqual(
      expect.objectContaining({ logicalAddress: "Справочник.Товары", order: ["name", "synonym"] })
    )
  })

  it("keeps collector conflicts visible", () => {
    const { collector, runtime } = createRuntime("Справочник.Новый")
    collector.setUuid("Справочник.Новый", "00000000-0000-4000-8000-000000000099")

    expect(() => runtime.identityOrCreate("uuid")).toThrow("Конфликт logicalAddress")
  })
})
