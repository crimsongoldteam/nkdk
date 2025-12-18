import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "../../../tests/mockConfigurationSettings"
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
          synonym: { items: { ru: "Реквизит справочника" } },
          type: { type: ["string"] },
        },
      ],
      tabularSections: [
        {
          name: "ТабличнаяЧасть1",
          synonym: { items: { ru: "Табличная часть" } },
          attributes: [
            {
              name: "РеквизитТабличнойЧасти",
              synonym: { items: { ru: "Реквизит табличной части" } },
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
          Синоним: "Реквизит справочника",
          Тип: "Строка",
        },
      },
      ТабличныеЧасти: {
        ТабличнаяЧасть1: {
          Синоним: "Табличная часть",
          Реквизиты: {
            РеквизитТабличнойЧасти: {
              Синоним: "Реквизит табличной части",
              Тип: "Строка",
            },
          },
        },
      },
    }

    const result = exportMetadataCatalogToEnterprise(mock, mockConfigurationSettings)
    expect(result).toEqual(expectedResult)
  })
})
