import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importChoiceParameterLinksFromEnterprise } from "./importFromEnterprise"

describe("importFromEnterprise", () => {
  it("should return undefined for undefined input", () => {
    const result = importChoiceParameterLinksFromEnterprise(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import single link", () => {
    const enterprise =
      "Отбор.Владелец(Справочник.ВетеринарноСопроводительныйДокументВЕТИС.Реквизит.ГрузоотправительХозяйствующийСубъект)"

    const result = importChoiceParameterLinksFromEnterprise(mockContext, mockRule, enterprise)

    expect(result).toEqual([
      {
        name: "Отбор.Владелец",
        dataPath: "Catalog.ВетеринарноСопроводительныйДокументВЕТИС.Attribute.ГрузоотправительХозяйствующийСубъект",
        valueChange: "Clear",
      },
    ])
  })

  it("should import multiple links from enterprise", () => {
    const enterprise =
      "Отбор.Владелец(Справочник.Справочник1.Реквизит.Реквизит1), Отбор.Владелец2(Справочник.Справочник2.Реквизит.Реквизит2)"

    const result = importChoiceParameterLinksFromEnterprise(mockContext, mockRule, enterprise)

    expect(result).toEqual([
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
    ])
  })

  it("should import with `DontChange` parameter", () => {
    const enterprise = "Отбор.Владелец(Справочник.Справочник1.Реквизит.Реквизит1, НеИзменять)"

    const result = importChoiceParameterLinksFromEnterprise(mockContext, mockRule, enterprise)

    expect(result).toEqual([
      {
        name: "Отбор.Владелец",
        dataPath: "Catalog.Справочник1.Attribute.Реквизит1",
        valueChange: "DontChange",
      },
    ])
  })

  it("should import multiple links with one having DontChange", () => {
    const enterprise =
      "Отбор.Владелец(Справочник.Справочник1.Реквизит.Реквизит1, НеИзменять), Отбор.Владелец2(Справочник.Справочник2.Реквизит.Реквизит2)"

    const result = importChoiceParameterLinksFromEnterprise(mockContext, mockRule, enterprise)

    expect(result).toEqual([
      {
        name: "Отбор.Владелец",
        dataPath: "Catalog.Справочник1.Attribute.Реквизит1",
        valueChange: "DontChange",
      },
      {
        name: "Отбор.Владелец2",
        dataPath: "Catalog.Справочник2.Attribute.Реквизит2",
        valueChange: "Clear",
      },
    ])
  })
})
