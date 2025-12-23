import { describe, expect, it } from "vitest"
import { mockСontext } from "~/lib/tests/mockContext"
import { exportChoiceParameterLinksToEnterprise } from "./exportToEnterprise"
import { ChoiceParameterLinks } from "./types"

describe("exportToEnterprise", () => {
  it("should export single link", () => {
    const mock: ChoiceParameterLinks = [
      {
        name: "Отбор.Владелец",
        dataPath: "Catalog.ВетеринарноСопроводительныйДокументВЕТИС.Attribute.ГрузоотправительХозяйствующийСубъект",
        valueChange: "Clear",
      },
    ]

    const result = exportChoiceParameterLinksToEnterprise(mockСontext, mock)
    expect(result).toEqual(
      "Отбор.Владелец(Справочник.ВетеринарноСопроводительныйДокументВЕТИС.Реквизит.ГрузоотправительХозяйствующийСубъект)"
    )
  })

  it("should export multiple links to enterprise", () => {
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

    const result = exportChoiceParameterLinksToEnterprise(mockСontext, mock)
    expect(result).toEqual(
      "Отбор.Владелец(Справочник.Справочник1.Реквизит.Реквизит1), Отбор.Владелец2(Справочник.Справочник2.Реквизит.Реквизит2)"
    )
  })

  it("should export with `DontChange` parameter", () => {
    const mock: ChoiceParameterLinks = [
      {
        name: "Отбор.Владелец",
        dataPath: "Catalog.Справочник1.Attribute.Реквизит1",
        valueChange: "DontChange",
      },
    ]

    const result = exportChoiceParameterLinksToEnterprise(mockСontext, mock)
    expect(result).toEqual("Отбор.Владелец(Справочник.Справочник1.Реквизит.Реквизит1, НеИзменять)")
  })
})
