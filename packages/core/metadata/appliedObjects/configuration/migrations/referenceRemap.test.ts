import { describe, expect, it } from "vitest"
import type { MetadataItemRule } from "../../../orchestration/property/types"
import { XML_SOURCE_KEYS } from "../../../orchestration/property/helpers"
import { remapReferenceModel } from "./referenceRemap"

const rule = {} as MetadataItemRule

describe("remapReferenceModel", () => {
  it("сохраняет reference item при переименовании реквизита через map и не мутирует исходную модель", () => {
    const currentModel = {
      attributes: [{ name: "НовыйАртикул" }],
    }
    const referenceModel = {
      attributes: [{ name: "Артикул", uuid: "attribute-old-uuid" }],
    }

    const result = remapReferenceModel({
      rule,
      currentObjectPath: "Справочник.Номенклатура",
      currentModel,
      referenceModel,
      referencePathByCurrentPath: new Map([
        ["Справочник.Номенклатура.Реквизит.НовыйАртикул", "Справочник.Товары.Реквизит.Артикул"],
      ]),
    })

    expect(result?.attributes).toEqual([{ name: "НовыйАртикул", uuid: "attribute-old-uuid" }])
    expect(referenceModel.attributes).toEqual([{ name: "Артикул", uuid: "attribute-old-uuid" }])
  })

  it("сохраняет неизменённые соседние элементы при переименовании одного реквизита", () => {
    const currentModel = {
      attributes: [{ name: "Контрагент" }, { name: "ДоговорКонтрагента" }],
      tabularSections: [
        {
          name: "Товары",
          attributes: [{ name: "Номенклатура" }, { name: "Количество" }],
        },
      ],
    }
    const referenceModel = {
      attributes: [
        { name: "Контрагент", uuid: "counterparty-uuid" },
        { name: "Договор", uuid: "contract-uuid" },
      ],
      tabularSections: [
        {
          name: "Товары",
          uuid: "goods-section-uuid",
          attributes: [
            { name: "Номенклатура", uuid: "item-uuid" },
            { name: "Количество", uuid: "quantity-uuid" },
          ],
        },
      ],
    }

    const result = remapReferenceModel({
      rule,
      currentObjectPath: "Документ.ПоступлениеТоваровУслуг",
      currentModel,
      referenceModel,
      referencePathByCurrentPath: new Map([
        [
          "Документ.ПоступлениеТоваровУслуг.Реквизит.ДоговорКонтрагента",
          "Документ.ПоступлениеТоваровУслуг.Реквизит.Договор",
        ],
      ]),
    })

    expect(result?.attributes).toEqual([
      { name: "Контрагент", uuid: "counterparty-uuid" },
      { name: "ДоговорКонтрагента", uuid: "contract-uuid" },
    ])
    expect(result?.tabularSections).toEqual([
      {
        name: "Товары",
        uuid: "goods-section-uuid",
        attributes: [
          { name: "Номенклатура", uuid: "item-uuid" },
          { name: "Количество", uuid: "quantity-uuid" },
        ],
      },
    ])
    expect(referenceModel.attributes[1]?.name).toBe("Договор")
  })

  it("сохраняет XML source keys у reference item после remap", () => {
    const currentModel = {
      attributes: [{ name: "ДоговорКонтрагента" }],
    }
    const referenceAttribute = { name: "Договор", uuid: "contract-uuid", indexing: undefined }
    Object.defineProperty(referenceAttribute, XML_SOURCE_KEYS, {
      value: { name: "Name", uuid: "_uuid" },
      enumerable: false,
    })
    const referenceModel = {
      attributes: [referenceAttribute],
    }

    const result = remapReferenceModel({
      rule,
      currentObjectPath: "Документ.ПоступлениеТоваровУслуг",
      currentModel,
      referenceModel,
      referencePathByCurrentPath: new Map([
        [
          "Документ.ПоступлениеТоваровУслуг.Реквизит.ДоговорКонтрагента",
          "Документ.ПоступлениеТоваровУслуг.Реквизит.Договор",
        ],
      ]),
    })

    const [attribute] = result?.attributes as Record<PropertyKey, unknown>[]
    expect(attribute?.[XML_SOURCE_KEYS]).toEqual({ name: "Name", uuid: "_uuid" })
    expect(Object.prototype.propertyIsEnumerable.call(attribute, XML_SOURCE_KEYS)).toBe(false)
  })

  it("сохраняет одноимённый reference item без entry в map", () => {
    const currentModel = {
      attributes: [{ name: "Артикул" }],
    }
    const referenceModel = {
      attributes: [{ name: "Артикул", uuid: "attribute-old-uuid" }],
    }

    const result = remapReferenceModel({
      rule,
      currentObjectPath: "Справочник.Товары",
      currentModel,
      referenceModel,
      referencePathByCurrentPath: new Map(),
    })

    expect(result?.attributes).toEqual([{ name: "Артикул", uuid: "attribute-old-uuid" }])
    expect(referenceModel.attributes).toEqual([{ name: "Артикул", uuid: "attribute-old-uuid" }])
  })

  it("сохраняет reference item при переименовании ресурса регистра через map", () => {
    const currentModel = {
      resources: [{ name: "НовыйОстаток" }],
    }
    const referenceModel = {
      resources: [{ name: "Остаток", uuid: "resource-old-uuid" }],
    }

    const result = remapReferenceModel({
      rule,
      currentObjectPath: "РегистрНакопления.Остатки",
      currentModel,
      referenceModel,
      referencePathByCurrentPath: new Map([
        ["РегистрНакопления.Остатки.Ресурс.НовыйОстаток", "РегистрНакопления.Остатки.Ресурс.Остаток"],
      ]),
    })

    expect(result?.resources).toEqual([{ name: "НовыйОстаток", uuid: "resource-old-uuid" }])
    expect(referenceModel.resources).toEqual([{ name: "Остаток", uuid: "resource-old-uuid" }])
  })

  it("сохраняет reference item для табличной части и её реквизита через map", () => {
    const currentModel = {
      tabularSections: [
        {
          name: "НовыеТовары",
          uuid: "current-section-uuid",
          attributes: [{ name: "НовоеКоличество" }],
        },
      ],
    }
    const referenceModel = {
      tabularSections: [
        {
          name: "Товары",
          uuid: "section-old-uuid",
          attributes: [{ name: "Количество", uuid: "attribute-old-uuid" }],
        },
      ],
    }

    const result = remapReferenceModel({
      rule,
      currentObjectPath: "Документ.Заказ",
      currentModel,
      referenceModel,
      referencePathByCurrentPath: new Map([
        ["Документ.Заказ.ТабличнаяЧасть.НовыеТовары", "Документ.Заказ.ТабличнаяЧасть.Товары"],
        [
          "Документ.Заказ.ТабличнаяЧасть.НовыеТовары.Реквизит.НовоеКоличество",
          "Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Количество",
        ],
      ]),
    })

    expect(result?.tabularSections).toEqual([
      {
        name: "НовыеТовары",
        uuid: "section-old-uuid",
        attributes: [{ name: "НовоеКоличество", uuid: "attribute-old-uuid" }],
      },
    ])
    expect(referenceModel.tabularSections[0]?.name).toBe("Товары")
    expect(referenceModel.tabularSections[0]?.attributes[0]?.name).toBe("Количество")
  })

  it("сохраняет reference item при переименовании реквизита адресации задачи", () => {
    const currentModel = {
      addressingAttributes: [{ name: "НовыйИсполнитель" }],
    }
    const referenceModel = {
      addressingAttributes: [{ name: "Исполнитель", uuid: "addressing-attribute-old-uuid" }],
    }

    const result = remapReferenceModel({
      rule,
      currentObjectPath: "Задача.Исполнение",
      currentModel,
      referenceModel,
      referencePathByCurrentPath: new Map([
        ["Задача.Исполнение.РеквизитАдресации.НовыйИсполнитель", "Задача.Исполнение.РеквизитАдресации.Исполнитель"],
      ]),
    })

    expect(result?.addressingAttributes).toEqual([{ name: "НовыйИсполнитель", uuid: "addressing-attribute-old-uuid" }])
    expect(referenceModel.addressingAttributes).toEqual([
      { name: "Исполнитель", uuid: "addressing-attribute-old-uuid" },
    ])
  })
})
