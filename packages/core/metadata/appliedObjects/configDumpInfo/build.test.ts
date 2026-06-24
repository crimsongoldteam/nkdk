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
        name: path.split(".").slice(-1)[0]!,
        referencePath: referencePaths.has(path) ? referencePaths.get(path) : path,
      },
    ])
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

  it("сохраняет порядок reference-записей и добавляет новые объекты в конец", () => {
    const reference: ConfigDumpInfo = new Map([
      [
        "Catalog.Второй",
        {
          id: "second-id",
          configVersion: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          children: new Map(),
        },
      ],
      [
        "Catalog.Первый",
        {
          id: "first-id",
          configVersion: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          children: new Map(),
        },
      ],
    ])

    const result = buildConfigDumpInfo({
      reference,
      yamlState: state(["Справочник.Первый", "Справочник.Второй", "Справочник.Третий"]),
      migrationState: state(["Справочник.Первый", "Справочник.Второй", "Справочник.Третий"]),
      referencePathByCurrentPath: new Map(),
      generators: { id: () => "new-id", configVersion: () => "cccccccccccccccccccccccccccccccccccccccc" },
    })

    expect([...result.keys()]).toEqual(["Catalog.Второй", "Catalog.Первый", "Catalog.Третий"])
  })

  it("сохраняет порядок дочерних reference-записей и добавляет новые в конец", () => {
    const reference: ConfigDumpInfo = new Map([
      [
        "Catalog.Товары",
        {
          id: "catalog-id",
          configVersion: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          children: new Map([
            ["Catalog.Товары.Attribute.Второй", "second-id"],
            ["Catalog.Товары.Attribute.Первый", "first-id"],
          ]),
        },
      ],
    ])

    const result = buildConfigDumpInfo({
      reference,
      yamlState: state([
        "Справочник.Товары",
        "Справочник.Товары.Реквизит.Первый",
        "Справочник.Товары.Реквизит.Второй",
        "Справочник.Товары.Реквизит.Третий",
      ]),
      migrationState: state([
        "Справочник.Товары",
        "Справочник.Товары.Реквизит.Первый",
        "Справочник.Товары.Реквизит.Второй",
        "Справочник.Товары.Реквизит.Третий",
      ]),
      referencePathByCurrentPath: new Map(),
      generators: { id: () => "new-id", configVersion: () => "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" },
    })

    expect([...(result.get("Catalog.Товары")?.children.keys() ?? [])]).toEqual([
      "Catalog.Товары.Attribute.Второй",
      "Catalog.Товары.Attribute.Первый",
      "Catalog.Товары.Attribute.Третий",
    ])
  })

  it("сохраняет неподдерживаемые дочерние reference-записи живого владельца", () => {
    const reference: ConfigDumpInfo = new Map([
      [
        "Catalog.Товары",
        {
          id: "catalog-id",
          configVersion: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          children: new Map([
            ["Catalog.Товары.Attribute.Старый", "old-attribute-id"],
            ["Catalog.Товары.Command.Открыть", "command-id"],
          ]),
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

    expect(result.get("Catalog.Номенклатура")?.children).toEqual(
      new Map([["Catalog.Номенклатура.Command.Открыть", "command-id"]])
    )
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

  it("берёт id новых объектов и дочерних элементов из накопленного хранилища", () => {
    const collected: ConfigDumpInfo = new Map([
      [
        "Catalog.Номенклатура",
        {
          id: "catalog-uuid-from-xml",
          configVersion: "",
          children: new Map([["Catalog.Номенклатура.Attribute.Артикул", "attribute-uuid-from-xml"]]),
        },
      ],
    ])

    const result = buildConfigDumpInfo({
      reference: new Map(),
      collected,
      yamlState: state(["Справочник.Номенклатура", "Справочник.Номенклатура.Реквизит.Артикул"]),
      migrationState: { nodes: new Map() },
      referencePathByCurrentPath: new Map(),
      generators: {
        id: () => {
          throw new Error("id generator must not be used for collected UUID entries")
        },
        configVersion: () => "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      },
    })

    expect(result.get("Catalog.Номенклатура")).toEqual({
      id: "catalog-uuid-from-xml",
      configVersion: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      children: new Map([["Catalog.Номенклатура.Attribute.Артикул", "attribute-uuid-from-xml"]]),
    })
  })

  it("падает для нового управляемого узла без UUID в накопленном хранилище", () => {
    expect(() =>
      buildConfigDumpInfo({
        reference: new Map(),
        collected: new Map(),
        yamlState: state(["Справочник.Номенклатура", "Справочник.Номенклатура.Реквизит.Артикул"]),
        migrationState: { nodes: new Map() },
        referencePathByCurrentPath: new Map(),
        generators: {
          id: () => {
            throw new Error("id generator must not be used")
          },
          configVersion: () => "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        },
      })
    ).toThrow('Не найден UUID ConfigDumpInfo для "Catalog.Номенклатура"')
  })

  it("назначает производной записи минимальный свободный постфикс с учётом reference", () => {
    const reference: ConfigDumpInfo = new Map([
      [
        "Catalog.Номенклатура",
        {
          id: "catalog-uuid",
          configVersion: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          children: new Map(),
        },
      ],
      [
        "Catalog.Номенклатура.ObjectModule",
        {
          id: "catalog-uuid.0",
          configVersion: "cccccccccccccccccccccccccccccccccccccccc",
          children: new Map(),
        },
      ],
    ])
    const collected: ConfigDumpInfo = new Map([
      [
        "Catalog.Номенклатура.Help",
        {
          id: "",
          configVersion: "",
          derivedFrom: "Catalog.Номенклатура",
          children: new Map(),
        },
      ],
    ])

    const result = buildConfigDumpInfo({
      reference,
      collected,
      yamlState: state(["Справочник.Номенклатура"]),
      migrationState: state(["Справочник.Номенклатура"]),
      referencePathByCurrentPath: new Map(),
      generators: {
        id: () => {
          throw new Error("direct id generator must not be used")
        },
        configVersion: () => "dddddddddddddddddddddddddddddddddddddddd",
      },
    })

    expect(result.get("Catalog.Номенклатура.Help")).toEqual({
      id: "catalog-uuid.1",
      configVersion: "dddddddddddddddddddddddddddddddddddddddd",
      derivedFrom: "Catalog.Номенклатура",
      children: new Map(),
    })
  })

  it("назначает производной записи id от UUID дочерней записи владельца", () => {
    const collected: ConfigDumpInfo = new Map([
      [
        "BusinessProcess.Согласование",
        {
          id: "business-process-uuid",
          configVersion: "",
          children: new Map([["BusinessProcess.Согласование.Command.Команда1", "command-uuid"]]),
        },
      ],
      [
        "BusinessProcess.Согласование.Command.Команда1.CommandModule",
        {
          id: "",
          configVersion: "",
          derivedFrom: "BusinessProcess.Согласование.Command.Команда1",
          children: new Map(),
        },
      ],
    ])

    const result = buildConfigDumpInfo({
      reference: new Map(),
      collected,
      yamlState: state(["БизнесПроцесс.Согласование"]),
      migrationState: state(["БизнесПроцесс.Согласование"]),
      referencePathByCurrentPath: new Map(),
      generators: {
        id: () => {
          throw new Error("direct id generator must not be used")
        },
        configVersion: () => "dddddddddddddddddddddddddddddddddddddddd",
      },
    })

    expect(result.get("BusinessProcess.Согласование")?.children).toEqual(
      new Map([["BusinessProcess.Согласование.Command.Команда1", "command-uuid"]])
    )
    expect(result.get("BusinessProcess.Согласование.Command.Команда1.CommandModule")).toEqual({
      id: "command-uuid.0",
      configVersion: "dddddddddddddddddddddddddddddddddddddddd",
      derivedFrom: "BusinessProcess.Согласование.Command.Команда1",
      children: new Map(),
    })
  })

  it("не перенумеровывает существующую производную запись из reference", () => {
    const reference: ConfigDumpInfo = new Map([
      [
        "Catalog.Номенклатура",
        {
          id: "catalog-uuid",
          configVersion: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          children: new Map(),
        },
      ],
      [
        "Catalog.Номенклатура.Help",
        {
          id: "catalog-uuid.7",
          configVersion: "cccccccccccccccccccccccccccccccccccccccc",
          children: new Map(),
        },
      ],
    ])
    const collected: ConfigDumpInfo = new Map([
      [
        "Catalog.Номенклатура.Help",
        {
          id: "",
          configVersion: "",
          derivedFrom: "Catalog.Номенклатура",
          children: new Map(),
        },
      ],
    ])

    const result = buildConfigDumpInfo({
      reference,
      collected,
      yamlState: state(["Справочник.Номенклатура"]),
      migrationState: state(["Справочник.Номенклатура"]),
      referencePathByCurrentPath: new Map(),
      generators: {
        id: () => {
          throw new Error("direct id generator must not be used")
        },
        configVersion: () => "dddddddddddddddddddddddddddddddddddddddd",
      },
    })

    expect(result.get("Catalog.Номенклатура.Help")).toEqual({
      id: "catalog-uuid.7",
      configVersion: "cccccccccccccccccccccccccccccccccccccccc",
      children: new Map(),
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

  it("удалить + добавить того же пути не переносит old id/configVersion", () => {
    const reference: ConfigDumpInfo = new Map([
      [
        "Catalog.Товары",
        {
          id: "old-catalog-id",
          configVersion: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          children: new Map(),
        },
      ],
    ])

    const result = buildConfigDumpInfo({
      reference,
      yamlState: state(["Справочник.Товары"]),
      migrationState: state(["Справочник.Товары"], new Map([["Справочник.Товары", undefined]])),
      referencePathByCurrentPath: new Map(),
      generators: { id: () => "new-catalog-id", configVersion: () => "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" },
    })

    expect(result.get("Catalog.Товары")).toEqual({
      id: "new-catalog-id",
      configVersion: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      children: new Map(),
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

  it("удалённый owner удаляет внешние entries", () => {
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
          children: new Map(),
        },
      ],
    ])

    const result = buildConfigDumpInfo({
      reference,
      yamlState: state([]),
      migrationState: state([]),
      referencePathByCurrentPath: new Map(),
      generators: { id: () => "new-id", configVersion: () => "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" },
    })

    expect(result.size).toBe(0)
  })

  it("сохраняет reference-only записи неуправляемого корня", () => {
    const reference: ConfigDumpInfo = new Map([
      [
        "Configuration.БухгалтерияПредприятия",
        {
          id: "configuration-id",
          configVersion: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          children: new Map(),
        },
      ],
      [
        "Catalog.Товары",
        {
          id: "catalog-id",
          configVersion: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          children: new Map(),
        },
      ],
    ])

    const result = buildConfigDumpInfo({
      reference,
      yamlState: state([]),
      migrationState: state([]),
      referencePathByCurrentPath: new Map(),
      generators: { id: () => "new-id", configVersion: () => "cccccccccccccccccccccccccccccccccccccccc" },
    })

    expect(result).toEqual(
      new Map([
        [
          "Configuration.БухгалтерияПредприятия",
          {
            id: "configuration-id",
            configVersion: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            children: new Map(),
          },
        ],
      ])
    )
  })
})

function kindFromPath(path: string): StructuralKind {
  const parts = path.split(".")
  if (parts.length === 2) return "object"
  if (parts[parts.length - 2] === "ТабличнаяЧасть") return "tabularSection"
  if (parts[parts.length - 2] === "Измерение") return "dimension"
  return "attribute"
}
