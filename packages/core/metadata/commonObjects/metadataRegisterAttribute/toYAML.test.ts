import { describe, expect, it } from "vitest"
import { attributesFromXML, attributesYAML } from "./__fixtures__/data"
import { exportMetadataRegisterAttributesToYAML } from "./register"
import { mockContext } from "~/tests/mockContext"

describe("export MetadataRegisterAttributes to YAML", () => {
  it("exports collection as YAML map keyed by name", () => {
    const result = exportMetadataRegisterAttributesToYAML(mockContext, undefined, attributesFromXML)

    expect(result).toEqual(attributesYAML)
    expect(result?.РеквизитВсеСвойства).toHaveProperty("Индексирование", "Индексировать")
    expect(result?.РеквизитВсеСвойства).toHaveProperty("ПолнотекстовыйПоиск", "НеИспользовать")
  })
})
