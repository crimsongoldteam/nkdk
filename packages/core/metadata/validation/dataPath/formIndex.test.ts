import { describe, expect, it } from "vitest"
import type { TypeDescription } from "~/metadata/commonObjects/typeDescription/types"
import type { ClientApplicationForm } from "~/metadata/forms/clientApplicationForm/types"
import type { FormAttribute } from "~/metadata/forms/commonObjects/formAttribute/types"
import { parseMetadataYaml } from "~/yaml/parseMetadataYaml"
import { buildFormDataPathIndex, getKnownPlatformFormSource } from "./formIndex"

describe("buildFormDataPathIndex", () => {
  it("indexes normal form attributes by exact name", () => {
    const index = buildIndex({
      attributes: [
        attribute("ПометкаУдаления", { type: ["boolean"] }),
        attribute("Дата", { type: ["dateTime"] }),
      ],
    })

    expect([...index.roots.keys()]).toEqual(["ПометкаУдаления", "Дата"])
    expect(index.getRoot("ПометкаУдаления")).toMatchObject({
      kind: "formAttribute",
      name: "ПометкаУдаления",
      typeInfo: {
        kinds: ["boolean"],
        nextTypes: [],
        sourceText: "boolean",
      },
    })
    expect(index.getRoot("пометкаУдаления")).toBeUndefined()
  })

  it("indexes ValueTable columns from the attribute columns", () => {
    const index = buildIndex({
      attributes: [
        attribute("Товары", { type: ["ValueTable"] }, [
          column("Номенклатура", { type: ["CatalogRef.Номенклатура"] }),
          column("Количество", { type: ["decimal"] }),
        ]),
      ],
    })

    const source = index.getRoot("Товары")
    expect(source?.typeInfo).toMatchObject({
      kinds: ["tableSource"],
      table: { kind: "ValueTable" },
    })
    expect(source?.tableSource).toMatchObject({
      table: { kind: "ValueTable" },
      hasColumns: true,
    })
    expect(source?.tableSource?.columns.get("Количество")).toEqual({
      name: "Количество",
      typeInfo: {
        kinds: ["scalar"],
        nextTypes: [],
        sourceText: "decimal",
      },
    })
  })

  it("indexes additional table columns by table data path", () => {
    const index = buildIndex({
      attributes: [
        {
          ...attribute("Объект", { type: ["DocumentObject.Заказ"] }),
          additionalColumns: [
            {
              table: "Объект.Товары",
              columns: [column("Артикул", { type: ["string"] })],
            },
          ],
        } as FormAttribute,
      ],
    })

    expect(index.additionalColumnsByTablePath.get("Объект.Товары")?.get("Артикул")).toEqual({
      name: "Артикул",
      typeInfo: {
        kinds: ["scalar"],
        nextTypes: [],
        sourceText: "string",
      },
    })
  })

  it("normalizes indexed additional table column paths", () => {
    const index = buildIndex({
      attributes: [
        {
          ...attribute("Доверенность", { type: ["ValueTable"] }),
          additionalColumns: [
            {
              table: "Доверенность[0].Документ[0]",
              columns: [column("Довер", { type: ["ValueTable"] })],
            },
          ],
        } as FormAttribute,
      ],
    })

    expect(index.additionalColumnsByTablePath.get("Доверенность.Документ")?.get("Довер")).toEqual({
      name: "Довер",
      typeInfo: {
        kinds: ["tableSource"],
        nextTypes: [],
        table: { kind: "ValueTable" },
        sourceText: "ValueTable",
      },
    })
  })

  it("indexes ValueTree columns from the attribute columns", () => {
    const index = buildIndex({
      attributes: [
        attribute("Дерево", { type: ["ValueTree"] }, [
          column("Используется", { type: ["boolean"] }),
        ]),
      ],
    })

    const source = index.getRoot("Дерево")
    expect(source?.typeInfo).toMatchObject({
      kinds: ["tableSource"],
      table: { kind: "ValueTree" },
    })
    expect(source?.tableSource?.columns.get("Используется")?.typeInfo).toEqual({
      kinds: ["boolean"],
      nextTypes: [],
      sourceText: "boolean",
    })
  })

  it("indexes RegisterRecordSet columns from the attribute columns", () => {
    const index = buildIndex({
      attributes: [
        attribute("НаборЗаписей", { type: ["InformationRegisterRecordSet.Настройки"] }, [
          column("ПериодГод", { type: ["decimal"] }),
        ]),
      ],
    })

    const source = index.getRoot("НаборЗаписей")
    expect(source?.typeInfo).toMatchObject({
      kinds: ["tableSource"],
      table: { kind: "RegisterRecordSet", owner: { kind: "РегистрСведений", name: "Настройки" } },
    })
    expect(source?.tableSource?.columns.get("ПериодГод")).toEqual({
      name: "ПериодГод",
      typeInfo: {
        kinds: ["scalar"],
        nextTypes: [],
        sourceText: "decimal",
      },
    })
  })

  it("does not index arbitrary columns for ValueList or GanttChart", () => {
    const index = buildIndex({
      attributes: [
        attribute("Список", { type: ["ValueListType"] }, [
          column("ПроизвольнаяКолонка", { type: ["string"] }),
        ]),
        attribute("Диаграмма", { type: ["GanttChart"] }, [
          column("ПроизвольнаяКолонка", { type: ["string"] }),
        ]),
      ],
    })

    expect(index.getRoot("Список")?.tableSource?.columns.size).toBe(0)
    expect(index.getRoot("Диаграмма")?.tableSource?.columns.size).toBe(0)
  })

  it("keeps table roots when columns are empty", () => {
    const index = buildIndex({
      attributes: [attribute("ПустаяТаблица", { type: ["ValueTable"] }, [])],
    })

    const source = index.getRoot("ПустаяТаблица")
    expect(source?.tableSource).toMatchObject({
      table: { kind: "ValueTable" },
      hasColumns: false,
    })
    expect(source?.tableSource?.columns.size).toBe(0)
  })

  it("treats attributes with dynamicList settings as DynamicList table sources", () => {
    const index = buildIndex({
      attributes: [
        {
          ...attribute("Список", { type: ["CatalogRef.Номенклатура"] }),
          dynamicList: {},
        } as FormAttribute,
      ],
    })

    const source = index.getRoot("Список")
    expect(source?.typeInfo).toMatchObject({
      kinds: ["dynamicList", "tableSource"],
      nextTypes: [],
      table: { kind: "DynamicList" },
      sourceText: "DynamicList",
    })
    expect(source?.tableSource).toMatchObject({
      table: { kind: "DynamicList" },
      hasColumns: false,
    })
  })

  it("keeps the first duplicate root and reports the second duplicate in YAML", () => {
    const parsed = parseMetadataYaml(
      [
        "Реквизиты:",
        "  Дубль:",
        "    Тип: Строка",
        "  Другой:",
        "    Тип: Булево",
        "  Дубль:",
        "    Тип: Число",
      ].join("\n"),
    )
    const index = buildIndex({
      parsed,
      attributes: [attribute("Дубль", { type: ["string"] }), attribute("Дубль", { type: ["decimal"] })],
    })

    expect(index.getRoot("Дубль")?.typeInfo.sourceText).toBe("string")
    expect(index.duplicateDiagnostics).toHaveLength(1)
    expect(index.duplicateDiagnostics[0]).toMatchObject({
      filePath: "/tmp/form.yaml",
      line: 6,
      col: 3,
      severity: "error",
      source: "structure",
      path: "/Реквизиты/Дубль",
    })
    expect(index.duplicateDiagnostics[0]?.message).toContain("Дубль")
  })
})

describe("getKnownPlatformFormSource", () => {
  it("detects exact known platform form sources", () => {
    expect(getKnownPlatformFormSource("КомпоновщикНастроекКомпоновкиДанных.Settings.Filter")).toEqual({
      kind: "platformSource",
      path: "КомпоновщикНастроекКомпоновкиДанных.Settings.Filter",
      matchedSource: "КомпоновщикНастроекКомпоновкиДанных.Settings.Filter",
      match: "exact",
    })
  })

  it("detects known platform form source prefixes only with path continuation", () => {
    expect(getKnownPlatformFormSource("КомпоновщикНастроекКомпоновкиДанных.Settings.Filter.Items")).toEqual({
      kind: "platformSource",
      path: "КомпоновщикНастроекКомпоновкиДанных.Settings.Filter.Items",
      matchedSource: "КомпоновщикНастроекКомпоновкиДанных.Settings.Filter",
      match: "prefix",
    })
    expect(getKnownPlatformFormSource("КомпоновщикНастроекКомпоновкиДанных.SettingsFilter")).toBeUndefined()
  })
})

function buildIndex(params: { attributes: FormAttribute[]; parsed?: ReturnType<typeof parseMetadataYaml> }) {
  return buildFormDataPathIndex({
    filePath: "/tmp/form.yaml",
    parsed: params.parsed ?? parseMetadataYaml("Реквизиты: {}\n"),
    form: {
      itemType: "ClientApplicationForm",
      attributes: params.attributes,
    } as ClientApplicationForm,
  })
}

function attribute(name: string, type: TypeDescription, columns: FormAttribute["columns"] = []): FormAttribute {
  return {
    itemType: "FormAttribute",
    name,
    type,
    columns,
  } as FormAttribute
}

function column(name: string, type: TypeDescription): FormAttribute["columns"][number] {
  return {
    itemType: "FormAttributeColumn",
    name,
    type,
  } as FormAttribute["columns"][number]
}
