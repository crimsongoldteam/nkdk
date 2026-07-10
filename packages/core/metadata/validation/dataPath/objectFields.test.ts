import { describe, expect, it } from "vitest"
import type { MetadataItemRule } from "../../orchestration/property/types"
import { MetadataAccumulationRegisterRules } from "../../appliedObjects/metadataAccumulationRegister/rules"
import { MetadataCatalogRules } from "../../appliedObjects/metadataCatalog/rules"
import { MetadataDocumentRules } from "../../appliedObjects/metadataDocument/rules"
import { MetadataInformationRegisterRules } from "../../appliedObjects/metadataInformationRegister/rules"
import { MetadataTaskRules } from "../../appliedObjects/metadataTask/rules"
import type { MetadataItem } from "../../orchestration/property/types"
import type { OwnerMetadata } from "./ownerCache"
import { buildObjectFieldIndex, resolveObjectFieldSegment } from "./objectFields"

describe("buildObjectFieldIndex", () => {
  it("indexes catalog attributes and standard attributes", () => {
    const index = buildObjectFieldIndex(
      owner({
        ref: { kind: "Справочник", name: "Номенклатура" },
        rule: MetadataCatalogRules,
        model: {
          itemType: "MetadataCatalog",
          attributes: [{ name: "Артикул", type: { type: ["string"] } }],
        },
      })
    )

    expect(index.fields.get("Артикул")).toMatchObject({
      name: "Артикул",
      kind: "attribute",
      sourceCollection: "attributes",
      typeInfo: { kinds: ["scalar"], sourceText: "string" },
    })
    expect(index.fields.get("Ссылка")).toMatchObject({
      name: "Ссылка",
      kind: "standardAttribute",
      typeInfo: {
        kinds: ["object"],
        nextTypes: [{ kind: "Справочник", name: "Номенклатура" }],
      },
    })
    expect(index.fields.get("Наименование")).toMatchObject({
      name: "Наименование",
      kind: "standardAttribute",
    })
  })

  it("indexes document standard attributes by YAML names", () => {
    const index = buildObjectFieldIndex(
      owner({
        ref: { kind: "Документ", name: "Заказ" },
        rule: MetadataDocumentRules,
        model: { itemType: "MetadataDocument" },
      })
    )

    expect(index.fields.get("Дата")).toMatchObject({ name: "Дата", kind: "standardAttribute" })
    expect(index.fields.get("Номер")).toMatchObject({ name: "Номер", kind: "standardAttribute" })
    expect(index.fields.get("Ссылка")?.typeInfo.nextTypes).toEqual([{ kind: "Документ", name: "Заказ" }])
  })

  it("uses model-dependent standard attribute names when rule provides them", () => {
    const index = buildObjectFieldIndex(
      owner({
        ref: { kind: "РегистрНакопления", name: "Обороты" },
        rule: MetadataAccumulationRegisterRules,
        model: {
          itemType: "MetadataAccumulationRegister",
          registerType: "Turnovers",
        },
      })
    )

    expect(index.fields.get("ВидДвижения")).toBeUndefined()
    expect(index.fields.get("Активность")).toMatchObject({
      name: "Активность",
      kind: "standardAttribute",
    })
  })

  it("indexes register dimensions, resources and attributes", () => {
    const index = buildObjectFieldIndex(
      owner({
        ref: { kind: "РегистрСведений", name: "Остатки" },
        rule: MetadataInformationRegisterRules,
        model: {
          itemType: "MetadataInformationRegister",
          attributes: [{ name: "Комментарий", type: { type: ["string"] } }],
          dimensions: [{ name: "Склад", type: { type: ["CatalogRef.Склады"] } }],
          resources: [{ name: "Количество", type: { type: ["decimal"] } }],
        },
      })
    )

    expect(index.fields.get("Комментарий")).toMatchObject({ kind: "attribute" })
    expect(index.fields.get("Склад")).toMatchObject({
      kind: "dimension",
      typeInfo: {
        kinds: ["object"],
        nextTypes: [{ kind: "Справочник", name: "Склады" }],
      },
    })
    expect(index.fields.get("Количество")).toMatchObject({ kind: "resource" })
  })

  it("builds tabular section table source with columns and row standard attributes", () => {
    const index = buildObjectFieldIndex(
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
      })
    )

    const table = index.fields.get("Товары")
    expect(table).toMatchObject({
      name: "Товары",
      kind: "tabularSection",
      typeInfo: {
        kinds: ["tableSource"],
        table: { kind: "TabularSection", owner: { kind: "Документ", name: "Заказ" }, name: "Товары" },
      },
      tableSource: {
        hasColumns: true,
      },
    })
    expect(table?.tableSource?.columns.get("Номенклатура")).toMatchObject({
      name: "Номенклатура",
      typeInfo: { nextTypes: [{ kind: "Справочник", name: "Номенклатура" }] },
    })
    expect(table?.tableSource?.columns.get("НомерСтроки")).toMatchObject({
      name: "НомерСтроки",
      kind: "standardAttribute",
    })
  })

  it("allows object traversal through Ссылка.Ссылка.Номер by keeping the same owner ref", () => {
    const index = buildObjectFieldIndex(
      owner({
        ref: { kind: "Документ", name: "Заказ" },
        rule: MetadataDocumentRules,
        model: { itemType: "MetadataDocument" },
      })
    )

    const firstRef = index.fields.get("Ссылка")?.typeInfo.nextTypes[0]
    const secondRef = firstRef
      ? buildObjectFieldIndex(owner({ ref: firstRef, rule: MetadataDocumentRules })).fields.get("Ссылка")
      : undefined

    expect(firstRef).toEqual({ kind: "Документ", name: "Заказ" })
    expect(secondRef?.typeInfo.nextTypes).toEqual([{ kind: "Документ", name: "Заказ" }])
    expect(index.fields.get("Номер")).toMatchObject({ name: "Номер" })
  })

  it("resolves platform standard attribute aliases only when YAML field exists", () => {
    const documentIndex = buildObjectFieldIndex(
      owner({
        ref: { kind: "Документ", name: "Заказ" },
        rule: MetadataDocumentRules,
        model: { itemType: "MetadataDocument" },
      })
    )
    const catalogIndex = buildObjectFieldIndex(
      owner({
        ref: { kind: "Справочник", name: "Номенклатура" },
        rule: MetadataCatalogRules,
        model: { itemType: "MetadataCatalog" },
      })
    )

    expect(resolveObjectFieldSegment({ index: documentIndex, segment: "Number" })).toMatchObject({ name: "Номер" })
    expect(resolveObjectFieldSegment({ index: catalogIndex, segment: "Description" })).toMatchObject({
      name: "Наименование",
    })
    expect(resolveObjectFieldSegment({ index: catalogIndex, segment: "Code" })).toMatchObject({ name: "Код" })
    expect(resolveObjectFieldSegment({ index: catalogIndex, segment: "DeletionMark" })).toMatchObject({
      name: "ПометкаУдаления",
      typeInfo: { kinds: ["boolean"] },
    })
    expect(resolveObjectFieldSegment({ index: catalogIndex, segment: "Parent" })).toMatchObject({
      name: "Родитель",
      typeInfo: { kinds: ["object"], nextTypes: [{ kind: "Справочник", name: "Номенклатура" }] },
    })
    expect(resolveObjectFieldSegment({ index: documentIndex, segment: "Parent" })).toBeUndefined()
  })

  it("resolves task-specific platform standard attribute aliases through task rules", () => {
    const index = buildObjectFieldIndex(
      owner({
        ref: { kind: "Задача", name: "ЗадачаИсполнителя" },
        rule: MetadataTaskRules,
        model: { itemType: "MetadataTask" },
      })
    )

    expect(resolveObjectFieldSegment({ index, segment: "Description" })).toMatchObject({
      name: "Описание",
      kind: "standardAttribute",
    })
    expect(resolveObjectFieldSegment({ index, segment: "Executed" })).toMatchObject({
      name: "Выполнена",
      kind: "standardAttribute",
      typeInfo: { kinds: ["boolean"] },
    })
    expect(index.fields.get("Наименование")).toBeUndefined()
  })

  it("indexes task addressing attributes as DataPath fields", () => {
    const index = buildObjectFieldIndex(
      owner({
        ref: { kind: "Задача", name: "ЗадачаИсполнителя" },
        rule: MetadataTaskRules,
        model: {
          itemType: "MetadataTask",
          addressingAttributes: [
            {
              itemType: "MetadataAttribute",
              name: "Исполнитель",
              type: { type: ["CatalogRef.Пользователи"] },
            },
          ],
        },
      })
    )

    expect(index.fields.get("Исполнитель")).toMatchObject({
      name: "Исполнитель",
      kind: "addressingAttribute",
      sourceCollection: "addressingAttributes",
      typeInfo: { kinds: ["object"], nextTypes: [{ kind: "Справочник", name: "Пользователи" }] },
    })
  })

  it("infers catalog owner standard attribute type from catalog owners", () => {
    const index = buildObjectFieldIndex(
      owner({
        ref: { kind: "Справочник", name: "ПодарочныеСертификаты" },
        rule: MetadataCatalogRules,
        model: {
          itemType: "MetadataCatalog",
          owners: ["Catalog.ВидыПодарочныхСертификатов"],
        },
      })
    )

    expect(index.fields.get("Владелец")?.typeInfo).toMatchObject({
      kinds: ["object"],
      nextTypes: [{ kind: "Справочник", name: "ВидыПодарочныхСертификатов" }],
      sourceText: "Catalog.ВидыПодарочныхСертификатов",
    })
    expect(resolveObjectFieldSegment({ index, segment: "Owner" })?.typeInfo.nextTypes).toEqual([
      { kind: "Справочник", name: "ВидыПодарочныхСертификатов" },
    ])
  })

  it("infers composite owner standard attribute type from multiple catalog owners", () => {
    const index = buildObjectFieldIndex(
      owner({
        ref: { kind: "Справочник", name: "ЗначенияСвойств" },
        rule: MetadataCatalogRules,
        model: {
          itemType: "MetadataCatalog",
          owners: ["Catalog.Номенклатура", "ChartOfCharacteristicTypes.Свойства"],
        },
      })
    )

    expect(index.fields.get("Владелец")?.typeInfo).toMatchObject({
      kinds: ["object"],
      isComposite: true,
      nextTypes: [
        { kind: "Справочник", name: "Номенклатура" },
        { kind: "ПланВидовХарактеристик", name: "Свойства" },
      ],
      sourceText: "Catalog.Номенклатура | ChartOfCharacteristicTypes.Свойства",
    })
  })

  it("uses explicit owner standard attribute type before catalog owners", () => {
    const index = buildObjectFieldIndex(
      owner({
        ref: { kind: "Справочник", name: "ПодарочныеСертификаты" },
        rule: MetadataCatalogRules,
        model: {
          itemType: "MetadataCatalog",
          owners: ["Catalog.ВидыПодарочныхСертификатов"],
          standardAttributes: [
            {
              name: "Owner",
              type: { type: ["CatalogRef.ЯвныйВладелец"] },
            },
          ],
        },
      })
    )

    expect(index.fields.get("Владелец")?.typeInfo).toMatchObject({
      kinds: ["object"],
      nextTypes: [{ kind: "Справочник", name: "ЯвныйВладелец" }],
      sourceText: "CatalogRef.ЯвныйВладелец",
    })
  })
})

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
