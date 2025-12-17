import { describe, expect, it } from "vitest"
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
    }

    const expectedResult: MetadataCatalogEnterprise = {
      Имя: "Контрагенты",
      Синоним: { ru: "Контрагенты" },
      Комментарий: "Комментарий",
      Иерархический: "Истина",
      ВидИерархии: "ИерархияГруппИЭлементов",
    }

    const result = exportMetadataCatalogToEnterprise(mock)
    expect(result).toEqual(expectedResult)
  })
})
