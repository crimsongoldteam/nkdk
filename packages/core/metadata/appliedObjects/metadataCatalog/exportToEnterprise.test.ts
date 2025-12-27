import { describe, expect, it } from "vitest"
import { mockСontext } from "../../../tests/mockContext"
import { exportMetadataCatalogToEnterprise } from "./exportToEnterprise"
import { MetadataCatalog, MetadataCatalogEnterprise } from "./types"

describe("exportMetadataCatalogToEnterprise", () => {
  it("should export metadata catalog to enterprise", () => {
    const mock: MetadataCatalog = {
      name: "Контрагенты",
      synonym: { items: { ru: "Контрагенты" } },
      comment: "Комментарий",
      hierarchical: true,
      hierarchyType: "HierarchyFoldersAndItems",
      attributes: [
        {
          name: "РеквизитСправочника",
          synonym: { items: { ru: "Какой-то реквизит справочника" } },
          type: { type: ["string"] },
        },
      ],
      tabularSections: [
        {
          name: "ТабличнаяЧасть1",
          synonym: { items: { ru: "Какая-то табличная часть" } },
          attributes: [
            {
              name: "РеквизитТабличнойЧасти",
              synonym: { items: { ru: "Какой-то реквизит табличной части" } },
              type: { type: ["string"] },
            },
          ],
        },
      ],
    }

    const expectedResult: MetadataCatalogEnterprise = {
      Синоним: "Контрагенты",
      Комментарий: "Комментарий",
      Иерархический: "Истина",
      ВидИерархии: "ИерархияГруппИЭлементов",
      Реквизиты: {
        РеквизитСправочника: {
          Синоним: "Какой-то реквизит справочника",
          Тип: "Строка",
        },
      },
      ТабличныеЧасти: {
        ТабличнаяЧасть1: {
          Синоним: "Какая-то табличная часть",
          Реквизиты: {
            РеквизитТабличнойЧасти: {
              Синоним: "Какой-то реквизит табличной части",
              Тип: "Строка",
            },
          },
        },
      },
    }

    const result = exportMetadataCatalogToEnterprise(mockСontext, mock)
    expect(result).toEqual(expectedResult)
  })
})
