import { describe, expect, it } from "vitest"
import { importMetadataCatalogFromEnterprise } from "~/metadata/appliedObjects/metadataCatalog/importFromEnterprise"
import { MetadataCatalog, MetadataCatalogEnterprise } from "~/metadata/appliedObjects/metadataCatalog/types"
import { mockСontext } from "~/tests/mockContext"

describe("importMetadataCatalogFromEnterprise", () => {
  it("should import metadata catalog from enterprise", () => {
    const mock: MetadataCatalogEnterprise = {
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

    const expectedResult: MetadataCatalog = {
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

    const result = importMetadataCatalogFromEnterprise(mockСontext, mock, "Контрагенты")
    expect(result).toEqual(expectedResult)
  })
})
