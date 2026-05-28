import { describe, expect, it } from "vitest"
import type { StructuralKind, StructuralState } from "../configuration/migrations/types"
import { buildConfigDumpInfo } from "./build"
import type { ConfigDumpInfo } from "./types"

const state = (paths: string[], referencePaths = new Map<string, string | undefined>()): StructuralState => ({
  nodes: new Map(
    paths.map((path) => [
      path,
      {
        path,
        kind: kindFromPath(path),
        name: path.split(".").at(-1)!,
        referencePath: referencePaths.has(path) ? referencePaths.get(path) : path,
      },
    ]),
  ),
})

describe("buildConfigDumpInfo", () => {
  it("сохраняет id/configVersion существующего объекта и id дочернего элемента", () => {
    const reference: ConfigDumpInfo = new Map([
      [
        "Catalog.Товары",
        {
          id: "catalog-id",
          configVersion: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          children: new Map([["Catalog.Товары.Attribute.Артикул", "attribute-id"]]),
        },
      ],
    ])

    const result = buildConfigDumpInfo({
      reference,
      yamlState: state(["Справочник.Товары", "Справочник.Товары.Реквизит.Артикул"]),
      migrationState: state(["Справочник.Товары", "Справочник.Товары.Реквизит.Артикул"]),
      referencePathByCurrentPath: new Map(),
      generators: { id: () => "new-id", configVersion: () => "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" },
    })

    expect(result.get("Catalog.Товары")).toEqual({
      id: "catalog-id",
      configVersion: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      children: new Map([["Catalog.Товары.Attribute.Артикул", "attribute-id"]]),
    })
  })

  it("переносит id/configVersion при переименовании объекта и id при переименовании реквизита", () => {
    const reference: ConfigDumpInfo = new Map([
      [
        "Catalog.Товары",
        {
          id: "catalog-id",
          configVersion: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          children: new Map([["Catalog.Товары.Attribute.Артикул", "attribute-id"]]),
        },
      ],
    ])

    const result = buildConfigDumpInfo({
      reference,
      yamlState: state(["Справочник.Номенклатура", "Справочник.Номенклатура.Реквизит.КодАртикула"]),
      migrationState: state(["Справочник.Номенклатура", "Справочник.Номенклатура.Реквизит.КодАртикула"]),
      referencePathByCurrentPath: new Map([
        ["Справочник.Номенклатура", "Справочник.Товары"],
        ["Справочник.Номенклатура.Реквизит.КодАртикула", "Справочник.Товары.Реквизит.Артикул"],
      ]),
      generators: { id: () => "new-id", configVersion: () => "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" },
    })

    expect(result.has("Catalog.Товары")).toBe(false)
    expect(result.get("Catalog.Номенклатура")).toEqual({
      id: "catalog-id",
      configVersion: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      children: new Map([["Catalog.Номенклатура.Attribute.КодАртикула", "attribute-id"]]),
    })
  })

  it("создаёт новые id/configVersion только для новых записей", () => {
    let idCounter = 0
    const result = buildConfigDumpInfo({
      reference: new Map(),
      yamlState: state(["Справочник.Номенклатура", "Справочник.Номенклатура.Реквизит.Артикул"]),
      migrationState: { nodes: new Map() },
      referencePathByCurrentPath: new Map(),
      generators: {
        id: () => `generated-id-${++idCounter}`,
        configVersion: () => "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      },
    })

    expect(result.get("Catalog.Номенклатура")).toEqual({
      id: "generated-id-1",
      configVersion: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      children: new Map([["Catalog.Номенклатура.Attribute.Артикул", "generated-id-2"]]),
    })
  })

  it("не берёт reference id для explicit add/recreate", () => {
    let idCounter = 0
    const reference: ConfigDumpInfo = new Map([
      [
        "Catalog.Номенклатура",
        {
          id: "old-catalog-id",
          configVersion: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          children: new Map([["Catalog.Номенклатура.Attribute.Артикул", "old-attribute-id"]]),
        },
      ],
    ])

    const explicitAdd = new Map<string, string | undefined>([
      ["Справочник.Номенклатура", undefined],
      ["Справочник.Номенклатура.Реквизит.Артикул", undefined],
    ])

    const result = buildConfigDumpInfo({
      reference,
      yamlState: state(["Справочник.Номенклатура", "Справочник.Номенклатура.Реквизит.Артикул"]),
      migrationState: state(["Справочник.Номенклатура", "Справочник.Номенклатура.Реквизит.Артикул"], explicitAdd),
      referencePathByCurrentPath: new Map(),
      generators: {
        id: () => `generated-id-${++idCounter}`,
        configVersion: () => "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      },
    })

    expect(result.get("Catalog.Номенклатура")).toEqual({
      id: "generated-id-1",
      configVersion: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      children: new Map([["Catalog.Номенклатура.Attribute.Артикул", "generated-id-2"]]),
    })
  })

  it("сохраняет внешнюю запись живого переименованного владельца", () => {
    const reference: ConfigDumpInfo = new Map([
      [
        "Catalog.Товары",
        {
          id: "catalog-id",
          configVersion: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          children: new Map(),
        },
      ],
      [
        "Catalog.Товары.Form.ФормаЭлемента",
        {
          id: "form-id",
          configVersion: "cccccccccccccccccccccccccccccccccccccccc",
          children: new Map([["Catalog.Товары.Form.ФормаЭлемента.Attribute.Тест", "form-child-id"]]),
        },
      ],
    ])

    const result = buildConfigDumpInfo({
      reference,
      yamlState: state(["Справочник.Номенклатура"]),
      migrationState: state(["Справочник.Номенклатура"]),
      referencePathByCurrentPath: new Map([["Справочник.Номенклатура", "Справочник.Товары"]]),
      generators: { id: () => "new-id", configVersion: () => "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" },
    })

    expect(result.get("Catalog.Номенклатура.Form.ФормаЭлемента")).toEqual({
      id: "form-id",
      configVersion: "cccccccccccccccccccccccccccccccccccccccc",
      children: new Map([["Catalog.Номенклатура.Form.ФормаЭлемента.Attribute.Тест", "form-child-id"]]),
    })
  })
})

function kindFromPath(path: string): StructuralKind {
  const parts = path.split(".")
  if (parts.length === 2) return "object"
  if (parts.at(-2) === "ТабличнаяЧасть") return "tabularSection"
  if (parts.at(-2) === "Измерение") return "dimension"
  return "attribute"
}
