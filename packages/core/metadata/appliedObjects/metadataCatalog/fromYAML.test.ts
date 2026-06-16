import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"
import { importMetadataCatalogFromYAML } from "./fromYAML"
import { exportMetadataCatalogToYAML } from "./toYAML"

describe("importMetadataCatalogFromYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importMetadataCatalogFromYAML(mockContext, undefined, "Контрагенты")
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = importMetadataCatalogFromYAML(mockContext, fullYAML, "СправочникПолный")

    expect(result).toEqual(full)
  })

  it("should import minimal", () => {
    const result = importMetadataCatalogFromYAML(mockContext, minimalYAML, "ПоУмолчанию")

    expect(result).toEqual(minimal)
  })

  it("should apply catalog attribute type restrictions to object YAML attributes", () => {
    const result = importMetadataCatalogFromYAML(
      mockContext,
      {
        Реквизиты: {
          Артикул: { Тип: "Строка" },
        },
      },
      "Товары"
    )

    expect(result?.attributes).toEqual([
      expect.objectContaining({
        name: "Артикул",
        type: { type: ["string"] },
      }),
    ])
  })

  it("should apply catalog attribute type restrictions to reference YAML attributes", () => {
    const result = importMetadataCatalogFromYAML(
      mockContext,
      {
        Реквизиты: {
          Контрагент: {
            Тип: "Справочник.Контрагенты",
          },
        },
      },
      "Товары"
    )

    expect(result?.attributes).toEqual([
      expect.objectContaining({
        name: "Контрагент",
        type: { type: ["CatalogRef.Контрагенты"] },
      }),
    ])
  })

  it("should reject invalid catalog attribute scalar TypeDescription", () => {
    expect(() =>
      importMetadataCatalogFromYAML(
        mockContext,
        {
          Реквизиты: {
            Неверный: { Тип: "НесуществующийТип" },
          },
        },
        "Товары"
      )
    ).toThrow("TypeDescription YAML value is not allowed by rule.allowedTypes")
  })

  it("should reject invalid catalog attribute multiple TypeDescription", () => {
    expect(() =>
      importMetadataCatalogFromYAML(
        mockContext,
        {
          Реквизиты: {
            Неверный: {
              Тип: ["Строка", "ХранилищеЗначения"],
            },
          },
        },
        "Товары"
      )
    ).toThrow("TypeDescription YAML value is not allowed by rule.allowedTypes")
  })

  it("should reject enum object refs in object ref collections", () => {
    expect(() =>
      importMetadataCatalogFromYAML(
        mockContext,
        {
          ВводитсяНаОсновании: ["Перечисление.Статусы"],
        },
        "Товары"
      )
    ).toThrow('Корень "Enum" не разрешён для цели метаданных')

    expect(() =>
      importMetadataCatalogFromYAML(
        mockContext,
        {
          Владельцы: ["Перечисление.Статусы"],
        },
        "Товары"
      )
    ).toThrow('Корень "Enum" не разрешён для цели метаданных')
  })

  it("should accept chart of characteristic types as catalog owner", () => {
    const result = importMetadataCatalogFromYAML(
      mockContext,
      {
        Владельцы: ["ПланВидовХарактеристик.ВопросыДляАнкетирования"],
      },
      "ВариантыОтветовАнкет"
    )

    expect(result?.owners).toEqual(["ChartOfCharacteristicTypes.ВопросыДляАнкетирования"])
  })

  it("should import with short format", () => {
    const result = exportMetadataCatalogToYAML(mockContext, minimal)

    expect(result).toEqual(minimalYAML)
  })
})
