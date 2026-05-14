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

  it("throws when structural node name is empty", async () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-yaml-"))
    fs.mkdirSync(join(dir, "Справочник", "Товары"), { recursive: true })
    fs.writeFileSync(join(dir, "Справочник", "Товары", "Свойства.yaml"), [
      "Реквизиты:",
      "  \"\":",
      "    Тип: string",
      "",
    ].join("\n"))

    await expect(collectStructuralStateFromYAML({ yamlDir: dir, context: mockContextToXML() })).rejects.toThrow(
      "Некорректное имя узла: владелец Справочник.Товары, тип Реквизит"
    )
  })

  it("collects register resources, dimensions and attributes from YAML", async () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-yaml-"))
    fs.mkdirSync(join(dir, "РегистрНакопления", "Остатки"), { recursive: true })
    fs.writeFileSync(join(dir, "РегистрНакопления", "Остатки", "Свойства.yaml"), [
      "Ресурсы:",
      "  Количество: Число(10, 0)",
      "Измерения:",
      "  Склад: Строка(10)",
      "Реквизиты:",
      "  Комментарий: Строка(10)",
      "",
    ].join("\n"))

    const state = await collectStructuralStateFromYAML({ yamlDir: dir, context: mockContextToXML() })
    expect([...state.nodes.keys()].sort()).toEqual([
      "РегистрНакопления.Остатки",
      "РегистрНакопления.Остатки.Измерение.Склад",
      "РегистрНакопления.Остатки.Реквизит.Комментарий",
      "РегистрНакопления.Остатки.Ресурс.Количество",
    ])
  })

  it("collects task addressing attributes from YAML", async () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-yaml-"))
    fs.mkdirSync(join(dir, "Задача", "Исполнение"), { recursive: true })
    fs.writeFileSync(join(dir, "Задача", "Исполнение", "Свойства.yaml"), [
      "РеквизитыАдресации:",
      "  Исполнитель:",
      "    Тип: string",
      "    ИзмерениеАдресации: InformationRegister.Адресация.Dimension.Исполнитель",
      "",
    ].join("\n"))

    const state = await collectStructuralStateFromYAML({ yamlDir: dir, context: mockContextToXML() })
    expect([...state.nodes.keys()].sort()).toEqual([
      "Задача.Исполнение",
      "Задача.Исполнение.РеквизитАдресации.Исполнитель",
    ])
  })

  it("collects catalog object, attributes and tabular section attributes from XML", async () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-xml-"))
    fs.mkdirSync(join(dir, "Catalogs"), { recursive: true })
    fs.copyFileSync(
      new URL("../../metadataCatalog/__fixtures__/full.xml", import.meta.url),
      join(dir, "Catalogs", "СправочникПолный.xml")
    )

    const state = await collectStructuralStateFromXML({ xmlDir: dir, context: mockContextFromXML() })
    expect([...state.nodes.keys()].sort()).toEqual([
      "Справочник.СправочникПолный",
      "Справочник.СправочникПолный.Реквизит.РеквизитСправочника",
      "Справочник.СправочникПолный.Реквизит.СтроковыйРеквизитСИндексом",
      "Справочник.СправочникПолный.ТабличнаяЧасть.ТабличнаяЧасть",
      "Справочник.СправочникПолный.ТабличнаяЧасть.ТабличнаяЧасть.Реквизит.РеквизитТабличнойЧасти",
    ])
  })

  it("collects task addressing attributes from XML", async () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-xml-"))
    fs.mkdirSync(join(dir, "Tasks"), { recursive: true })
    fs.copyFileSync(
      new URL("../../metadataTask/__fixtures__/full.xml", import.meta.url),
      join(dir, "Tasks", "ЗадачаВсеСвойства.xml")
    )

    const state = await collectStructuralStateFromXML({ xmlDir: dir, context: mockContextFromXML() })
    expect([...state.nodes.keys()].filter((path) => path.includes("РеквизитАдресации")).sort()).toEqual([
      "Задача.ЗадачаВсеСвойства.РеквизитАдресации.РеквизитАдресацииВсеСвойства",
      "Задача.ЗадачаВсеСвойства.РеквизитАдресации.РеквизитАдресацииПоУмолчанию",
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
