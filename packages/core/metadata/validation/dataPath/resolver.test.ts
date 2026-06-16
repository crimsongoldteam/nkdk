import { describe, expect, it } from "vitest"
import type { TypeDescription } from "~/metadata/commonObjects/typeDescription/types"
import type { ClientApplicationForm } from "~/metadata/forms/clientApplicationForm/types"
import type { FormAttribute } from "~/metadata/forms/commonObjects/formAttribute/types"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import { MetadataDocumentRules } from "~/metadata/appliedObjects/metadataDocument/rules"
import type { MetadataItem, MetadataItemRule } from "~/metadata/orchestration/property/types"
import { parseMetadataYaml } from "~/yaml/parseMetadataYaml"
import { buildFormDataPathIndex, type FormDataPathIndex } from "./formIndex"
import { buildObjectFieldIndex } from "./objectFields"
import type { OwnerMetadata, OwnerMetadataCache, OwnerMetadataResult } from "./ownerCache"
import { resolveDataPath } from "./resolver"

describe("resolveDataPath", () => {
  it("resolves a valid form attribute", () => {
    const result = resolve("ПометкаУдаления", {
      index: indexWithAttributes([attribute("ПометкаУдаления", { type: ["boolean"] })]),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "ПометкаУдаления",
        segments: ["ПометкаУдаления"],
        source: { kind: "formAttribute", name: "ПометкаУдаления" },
        typeInfo: { kinds: ["boolean"] },
      },
    })
  })

  it("resolves a valid ValueTable column", () => {
    const result = resolve("Товары.Количество", {
      index: indexWithAttributes([
        attribute("Товары", { type: ["ValueTable"] }, [column("Количество", { type: ["decimal"] })]),
      ]),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "Товары.Количество",
        segments: ["Товары", "Количество"],
        source: { kind: "tableColumn", table: "Товары", name: "Количество" },
        typeInfo: { kinds: ["scalar"], sourceText: "decimal" },
      },
    })
  })

  it("reports a missing first segment without falling back to owner names", () => {
    const result = resolve("Объект.Наименование", {
      index: indexWithAttributes([attribute("Реквизит", { type: ["string"] })]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          source: "structure",
          severity: "error",
          message: 'ПутьКДанным "Объект.Наименование": неизвестный корень "Объект"',
        }),
      ],
    })
  })

  it("uses strict case-sensitive root lookup", () => {
    const result = resolve("объект.Наименование", {
      index: indexWithAttributes([attribute("Объект", { type: ["CatalogRef.Номенклатура"] })]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message: 'ПутьКДанным "объект.Наименование": неизвестный корень "объект"',
        }),
      ],
    })
  })

  it("reports an intermediate composite type", () => {
    const result = resolve("Контрагент.Наименование", {
      index: indexWithAttributes([
        attribute("Контрагент", { type: ["CatalogRef.Контрагенты", "CatalogRef.Партнеры"] }),
      ]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          source: "structure",
          message: 'ПутьКДанным "Контрагент.Наименование": промежуточный реквизит "Контрагент" имеет составной тип',
        }),
      ],
    })
  })

  it("reports an intermediate composite object and scalar type", () => {
    const result = resolve("Контрагент.Наименование", {
      index: indexWithAttributes([
        attribute("Контрагент", { type: ["CatalogRef.Контрагенты", "string"] }),
      ]),
      ownerCache: ownerCache([owner({ ref: { kind: "Справочник", name: "Контрагенты" } })]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          source: "structure",
          message: 'ПутьКДанным "Контрагент.Наименование": промежуточный реквизит "Контрагент" имеет составной тип',
        }),
      ],
    })
  })

  it("reports an intermediate composite table and scalar type before resolving columns", () => {
    const result = resolve("Товары.Количество", {
      index: indexWithAttributes([
        attribute("Товары", { type: ["ValueTable", "string"] }, [column("Количество", { type: ["decimal"] })]),
      ]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          source: "structure",
          message: 'ПутьКДанным "Товары.Количество": промежуточный реквизит "Товары" имеет составной тип',
        }),
      ],
    })
  })

  it("reports an intermediate unknown type", () => {
    const result = resolve("Реквизит.Поле", {
      index: indexWithAttributes([attribute("Реквизит", undefined)]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message: 'ПутьКДанным "Реквизит.Поле": промежуточный реквизит "Реквизит" имеет неизвестный тип',
        }),
      ],
    })
  })

  it("reports an unsupported intermediate type", () => {
    const result = resolve("Хранилище.Поле", {
      index: indexWithAttributes([attribute("Хранилище", { type: ["ValueStorage"] })]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message: 'ПутьКДанным "Хранилище.Поле": промежуточный реквизит "Хранилище" имеет неподдерживаемый тип',
        }),
      ],
    })
  })

  it("resolves an owner attribute through OwnerMetadataCache", () => {
    const result = resolve("Объект.Артикул", {
      index: indexWithAttributes([attribute("Объект", { type: ["CatalogRef.Номенклатура"] })]),
      ownerCache: ownerCache([
        owner({
          ref: { kind: "Справочник", name: "Номенклатура" },
          rule: MetadataCatalogRules,
          model: {
            itemType: "MetadataCatalog",
            attributes: [{ name: "Артикул", type: { type: ["string"] } }],
          },
        }),
      ]),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "Объект.Артикул",
        segments: ["Объект", "Артикул"],
        source: { kind: "objectField", owner: { kind: "Справочник", name: "Номенклатура" }, name: "Артикул" },
        typeInfo: { kinds: ["scalar"], sourceText: "string" },
      },
    })
  })

  it("resolves a tabular section column through owner metadata", () => {
    const result = resolve("Объект.Товары.Номенклатура", {
      index: indexWithAttributes([attribute("Объект", { type: ["DocumentRef.Заказ"] })]),
      ownerCache: ownerCache([
        owner({
          ref: { kind: "Документ", name: "Заказ" },
          rule: MetadataDocumentRules,
          model: {
            itemType: "MetadataDocument",
            tabularSections: [
              {
                itemType: "MetadataTabularSection",
                name: "Товары",
                attributes: [{ name: "Номенклатура", type: { type: ["CatalogRef.Номенклатура"] } }],
              },
            ],
          },
        }),
      ]),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "Объект.Товары.Номенклатура",
        segments: ["Объект", "Товары", "Номенклатура"],
        source: { kind: "tableColumn", table: "Товары", name: "Номенклатура" },
        typeInfo: { nextTypes: [{ kind: "Справочник", name: "Номенклатура" }] },
      },
    })
  })

  it("resolves LineNumber as an alias for the YAML row number column", () => {
    const result = resolve("Объект.Товары.LineNumber", {
      index: indexWithAttributes([attribute("Объект", { type: ["DocumentRef.Заказ"] })]),
      ownerCache: ownerCache([
        owner({
          ref: { kind: "Документ", name: "Заказ" },
          rule: MetadataDocumentRules,
          model: {
            itemType: "MetadataDocument",
            tabularSections: [
              {
                itemType: "MetadataTabularSection",
                name: "Товары",
                attributes: [{ name: "Номенклатура", type: { type: ["CatalogRef.Номенклатура"] } }],
              },
            ],
          },
        }),
      ]),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "Объект.Товары.LineNumber",
        segments: ["Объект", "Товары", "LineNumber"],
        source: { kind: "tableColumn", table: "Товары", name: "НомерСтроки" },
      },
    })
  })

  it("resolves Date as an alias for the YAML standard attribute name", () => {
    const result = resolve("Объект.Date", {
      index: indexWithAttributes([attribute("Объект", { type: ["DocumentRef.Заказ"] })]),
      ownerCache: ownerCache([
        owner({
          ref: { kind: "Документ", name: "Заказ" },
          rule: MetadataDocumentRules,
          model: { itemType: "MetadataDocument" },
        }),
      ]),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "Объект.Date",
        segments: ["Объект", "Date"],
        source: { kind: "objectField", owner: { kind: "Документ", name: "Заказ" }, name: "Дата" },
      },
    })
  })

  it("requires a child table DataPath to start with the parent table path", () => {
    const result = resolve("Номенклатура", {
      index: indexWithAttributes([
        attribute("Товары", { type: ["ValueTable"] }, [column("Номенклатура", { type: ["CatalogRef.Номенклатура"] })]),
      ]),
      tableContext: { dataPath: "Товары" },
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message: 'ПутьКДанным "Номенклатура": путь колонки должен начинаться с "Товары."',
        }),
      ],
    })
  })

  it("returns a warning for DynamicList fields", () => {
    const result = resolve("Список.Наименование", {
      index: indexWithAttributes([
        { ...attribute("Список", { type: ["CatalogRef.Номенклатура"] }), dynamicList: { itemType: "DynamicList" } },
      ]),
    })

    expect(result).toMatchObject({
      status: "warning",
      diagnostics: [
        expect.objectContaining({
          severity: "warning",
          source: "structure",
          message: 'ПутьКДанным "Список.Наименование": колонки динамического списка пока не проверяются',
        }),
      ],
    })
  })

  it("returns a warning for a known platform source", () => {
    const result = resolve("КомпоновщикНастроекКомпоновкиДанных.Settings.Filter.Items", {
      index: indexWithAttributes([]),
    })

    expect(result).toMatchObject({
      status: "warning",
      diagnostics: [
        expect.objectContaining({
          severity: "warning",
          source: "structure",
          message:
            'ПутьКДанным "КомпоновщикНастроекКомпоновкиДанных.Settings.Filter.Items": платформенный источник пока не проверяется',
        }),
      ],
    })
  })

  it("returns a warning for Items.*.CurrentData.* paths", () => {
    const result = resolve("Items.Таблица.CurrentData.Номенклатура", {
      index: indexWithAttributes([]),
    })

    expect(result).toMatchObject({
      status: "warning",
      diagnostics: [
        expect.objectContaining({
          severity: "warning",
          source: "structure",
          message: 'ПутьКДанным "Items.Таблица.CurrentData.Номенклатура": CurrentData пока не проверяется',
        }),
      ],
    })
  })

  it("returns a warning for unsupported tilde variant paths", () => {
    const result = resolve("~Список.Period~Список.Период", {
      index: indexWithAttributes([]),
    })

    expect(result).toMatchObject({
      status: "warning",
      diagnostics: [
        expect.objectContaining({
          severity: "warning",
          source: "structure",
          message: 'ПутьКДанным "~Список.Period~Список.Период": вариантный путь пока не проверяется',
        }),
      ],
    })
  })

  it("returns a warning for unsupported tilde variant paths before table context validation", () => {
    const result = resolve("~Список.Period~Список.Период", {
      index: indexWithAttributes([]),
      tableContext: { dataPath: "Список" },
    })

    expect(result).toMatchObject({
      status: "warning",
      diagnostics: [
        expect.objectContaining({
          severity: "warning",
          message: 'ПутьКДанным "~Список.Period~Список.Период": вариантный путь пока не проверяется',
        }),
      ],
    })
  })

  it("reports Ref instead of YAML Ссылка as an error", () => {
    const result = resolve("Объект.Ref", {
      index: indexWithAttributes([attribute("Объект", { type: ["CatalogRef.Номенклатура"] })]),
      ownerCache: ownerCache([owner({ ref: { kind: "Справочник", name: "Номенклатура" } })]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          source: "structure",
          severity: "error",
          message:
            'ПутьКДанным "Объект.Ref": используйте YAML-имя реквизита вместо платформенного "Ref"',
        }),
      ],
    })
  })
})

function resolve(
  value: string,
  params: {
    index: FormDataPathIndex
    ownerCache?: OwnerMetadataCache
    tableContext?: { dataPath: string }
  },
) {
  const parsed = parseMetadataYaml(`ПутьКДанным: ${JSON.stringify(value)}\n`)

  return resolveDataPath({
    filePath: "/tmp/form.yaml",
    parsed,
    yamlPath: ["ПутьКДанным"],
    value,
    index: params.index,
    ownerCache: params.ownerCache ?? ownerCache([]),
    ...(params.tableContext ? { tableContext: params.tableContext } : {}),
  })
}

function indexWithAttributes(attributes: FormAttribute[]): FormDataPathIndex {
  return buildFormDataPathIndex({
    filePath: "/tmp/form.yaml",
    parsed: parseMetadataYaml("Реквизиты: {}\n"),
    form: {
      itemType: "ClientApplicationForm",
      attributes,
    } as ClientApplicationForm,
  })
}

function attribute(name: string, type: TypeDescription | undefined, columns: FormAttribute["columns"] = []): FormAttribute {
  return {
    itemType: "FormAttribute",
    name,
    ...(type !== undefined ? { type } : {}),
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

function ownerCache(owners: OwnerMetadata[]): OwnerMetadataCache {
  const byKey = new Map(owners.map((item) => [ownerKey(item.ref), item]))

  return {
    get(ref): OwnerMetadataResult {
      const found = byKey.get(ownerKey(ref))
      if (found !== undefined) return { status: "ok", owner: found }
      return {
        status: "not-found",
        diagnostics: [
          {
            filePath: "/tmp/Свойства.yaml",
            line: 1,
            col: 1,
            message: "Не найден владелец",
            severity: "error",
            source: "cross-file",
          },
        ],
      }
    },
  }
}

function owner(params: {
  ref?: OwnerMetadata["ref"]
  rule?: MetadataItemRule
  model?: MetadataItem & Record<string, unknown>
}): OwnerMetadata {
  const rule = params.rule ?? MetadataCatalogRules
  const ownerWithoutIndex = {
    ref: params.ref ?? { kind: "Справочник", name: "Номенклатура" },
    filePath: "/tmp/Свойства.yaml",
    model: params.model ?? { itemType: rule.itemType },
    rule,
    spec: {
      kind: "catalog",
      dir: "Справочник",
      rule,
      exportSchema: () => ({ type: "object" }) as never,
      importModel: () => undefined,
    },
  }

  return {
    ...ownerWithoutIndex,
    fieldIndex: buildObjectFieldIndex(ownerWithoutIndex),
  }
}

function ownerKey(ref: OwnerMetadata["ref"]): string {
  return `${ref.kind}:${ref.name ?? ""}`
}
