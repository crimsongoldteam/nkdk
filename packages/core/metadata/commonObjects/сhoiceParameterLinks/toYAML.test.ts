import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { exportChoiceParameterLinksToYAML } from "./toYAML"
import { ChoiceParameterLinks } from "./types"

describe("exportToYAML", () => {
  it("should export single link", () => {
    const mock: ChoiceParameterLinks = [
      {
        name: "Отбор.Владелец",
        dataPath: "Catalog.ВетеринарноСопроводительныйДокументВЕТИС.Attribute.ГрузоотправительХозяйствующийСубъект",
        valueChange: "Clear",
      },
    ]

    const result = exportChoiceParameterLinksToYAML(mockContext, mockRule, mock)
    expect(result).toEqual([
      {
        Имя: "Отбор.Владелец",
        ПутьКДанным: "Catalog.ВетеринарноСопроводительныйДокументВЕТИС.Attribute.ГрузоотправительХозяйствующийСубъект",
      },
    ])
  })

  it("should export multiple links to yaml", () => {
    const mock: ChoiceParameterLinks = [
      {
        name: "Отбор.Владелец",
        dataPath: "Catalog.Справочник1.Attribute.Реквизит1",
        valueChange: "Clear",
      },
      {
        name: "Отбор.Владелец2",
        dataPath: "Catalog.Справочник2.Attribute.Реквизит2",
        valueChange: "Clear",
      },
    ]

    const result = exportChoiceParameterLinksToYAML(mockContext, mockRule, mock)
    expect(result).toEqual([
      {
        Имя: "Отбор.Владелец",
        ПутьКДанным: "Catalog.Справочник1.Attribute.Реквизит1",
      },
      {
        Имя: "Отбор.Владелец2",
        ПутьКДанным: "Catalog.Справочник2.Attribute.Реквизит2",
      },
    ])
  })

  it("should export with `DontChange` parameter", () => {
    const mock: ChoiceParameterLinks = [
      {
        name: "Отбор.Владелец",
        dataPath: "Catalog.Справочник1.Attribute.Реквизит1",
        valueChange: "DontChange",
      },
    ]

    const result = exportChoiceParameterLinksToYAML(mockContext, mockRule, mock)
    expect(result).toEqual([
      {
        Имя: "Отбор.Владелец",
        ПутьКДанным: "Catalog.Справочник1.Attribute.Реквизит1",
        РежимИзменения: "НеИзменять",
      },
    ])
  })

  it("exports structured links without translating dataPath", () => {
    const mock: ChoiceParameterLinks = [
      {
        name: "Отбор.ПланСчетов",
        dataPath: "ПланСчетов",
        valueChange: "Clear",
      },
      {
        name: "Отбор.Характеристика",
        dataPath: "Характеристика",
        valueChange: "DontChange",
      },
    ]

    const result = exportChoiceParameterLinksToYAML(mockContext, mockRule, mock)

    expect(result).toEqual([
      {
        Имя: "Отбор.ПланСчетов",
        ПутьКДанным: "ПланСчетов",
      },
      {
        Имя: "Отбор.Характеристика",
        ПутьКДанным: "Характеристика",
        РежимИзменения: "НеИзменять",
      },
    ])
  })
})
