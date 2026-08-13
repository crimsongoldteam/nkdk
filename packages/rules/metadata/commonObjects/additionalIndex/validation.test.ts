import { describe, expect, it } from "vitest"
import { parseMetadataYaml } from "@nkdk/runtime"
import { analyzeAdditionalIndexItem } from "./validation"

describe("additional index validation", () => {
  it("rejects a field repeated between indexed and additional fields", () => {
    const item = {
      ИндексируемыеПоля: ["Ссылка", "Код"],
      ДополнительныеПоля: ["Ссылка"],
    }

    expect(analyze(item).diagnostics).toEqual([
      expect.objectContaining({ severity: "error", message: "Поле «Ссылка» повторяется в дополнительном индексе" }),
    ])
  })

  it("rejects a definitely excessive number of physical columns", () => {
    const item = { ИндексируемыеПоля: Array.from({ length: 17 }, (_, index) => `Поле${index}`) }

    expect(analyze(item).diagnostics).toEqual([
      expect.objectContaining({ severity: "error", message: "Дополнительный индекс содержит больше 16 полей" }),
    ])
  })

  it("accepts distinct fields within the computable limit", () => {
    expect(analyze({ ИндексируемыеПоля: ["Ссылка"], ДополнительныеПоля: ["Дата"] }).diagnostics).toEqual([])
  })
})

function analyze(item: Record<string, unknown>) {
  const parsed = parseMetadataYaml("[]\n")
  return analyzeAdditionalIndexItem({
    itemType: "AdditionalIndexItem",
    item,
    itemYamlPath: [0],
    rootYaml: [item],
    rootRule: {},
    owner: { dir: "Справочник", name: "Товары" },
    filePath: "/project/Справочник/Товары/ДополнительныеИндексы.yaml",
    parsed,
  })
}
