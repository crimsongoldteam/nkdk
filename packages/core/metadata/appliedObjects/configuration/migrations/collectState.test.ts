import fs from "fs"
import { mkdtempSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { collectStructuralStateFromXML, collectStructuralStateFromYAML } from "./collectState"

describe("collectStructuralState", () => {
  it("collects catalog object, attributes and tabular section attributes from YAML", async () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-yaml-"))
    fs.mkdirSync(join(dir, "Справочник", "Товары"), { recursive: true })
    fs.writeFileSync(join(dir, "Справочник", "Товары", "Свойства.yaml"), [
      "Реквизиты:",
      "  Артикул:",
      "    Тип: string",
      "ТабличныеЧасти:",
      "  Состав:",
      "    Реквизиты:",
      "      Количество:",
      "        Тип: number",
      "",
    ].join("\n"))

    const state = await collectStructuralStateFromYAML({ yamlDir: dir, context: mockContextToXML() })
    expect([...state.nodes.keys()].sort()).toEqual([
      "Справочник.Товары",
      "Справочник.Товары.Реквизит.Артикул",
      "Справочник.Товары.ТабличнаяЧасть.Состав",
      "Справочник.Товары.ТабличнаяЧасть.Состав.Реквизит.Количество",
    ])
  })

  it("returns empty XML state when reference dir does not exist", async () => {
    const state = await collectStructuralStateFromXML({
      xmlDir: join(tmpdir(), "missing-reference-dir"),
      context: mockContextFromXML(),
    })
    expect([...state.nodes.keys()]).toEqual([])
  })
})
