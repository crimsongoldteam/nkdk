import { describe, expect, it } from "vitest"
import { ZElementType } from "~/lib/metadata/forms/elements/types"
import { TUsualGroup } from "~/lib/metadata/forms/elements/usualGroup/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { parseTree } from "./parseTree"

describe("parseTree", () => {
  it("should parse one-line group", () => {
    const mock = `%{ОднострочнаяГруппа} {Элемент1}; {Элемент2}`

    const expectedResult: TUsualGroup = {
      elementType: ZElementType.enum.UsualGroup,
      group: SE.ZColumnsGroup.enum.Horizontal,
      name: "ОднострочнаяГруппа",
      title: { items: { ru: "Однострочная группа" } },
      childItems: [
        {
          elementType: ZElementType.enum.GroupContent,
          content: "Элемент1\nЭлемент2",
        },
      ],
    }

    const result = parseTree(mock)

    expect(result).toEqual(expectedResult)
  })

  it("should parse horizontal group with content", () => {
    const mock = `%{Группа}
\t{Элемент1}
\t{Элемент2}`
    const expectedResult: TUsualGroup = {
      elementType: ZElementType.enum.UsualGroup,
      group: SE.ZColumnsGroup.enum.Horizontal,
      name: "Группа",
      childItems: [
        {
          elementType: ZElementType.enum.GroupContent,
          content: "Элемент1\nЭлемент2",
        },
      ],
    }

    const result = parseTree(mock)

    expect(result).toEqual(expectedResult)
  })

  it("should parse vertical group with content", () => {
    const mock = `#{Группа}
\t{Элемент1}
\t{Элемент2}`
    const expectedResult: TUsualGroup = {
      elementType: ZElementType.enum.UsualGroup,
      group: SE.ZColumnsGroup.enum.Vertical,
      name: "Группа",
      childItems: [
        {
          elementType: ZElementType.enum.GroupContent,
          content: "Элемент1\nЭлемент2",
        },
      ],
    }

    const result = parseTree(mock)

    expect(result).toEqual(expectedResult)
  })

  it("should parse simplifyed horizontal group with content and properties", () => {
    const mock = `%{ГоризонтальнаяГруппа}
\t#{ВертикальнаяГруппа1} #{ВертикальнаяГруппа2}
\t{Элемент1} + {Элемент2}`
    const expectedResult: TUsualGroup = {
      elementType: ZElementType.enum.UsualGroup,
      group: SE.ZColumnsGroup.enum.Horizontal,
      name: "ГоризонтальнаяГруппа",
      childItems: [
        {
          elementType: ZElementType.enum.UsualGroup,
          name: "ВертикальнаяГруппа1",
          group: SE.ZColumnsGroup.enum.Vertical,
          childItems: [
            {
              elementType: ZElementType.enum.GroupContent,
              content: "Элемент1",
            },
          ],
        },
        {
          elementType: ZElementType.enum.UsualGroup,
          name: "ВертикальнаяГруппа2",
          group: SE.ZColumnsGroup.enum.Vertical,
          childItems: [
            {
              elementType: ZElementType.enum.GroupContent,
              content: "Элемент2",
            },
          ],
        },
      ],
    }

    const result = parseTree(mock)

    expect(result).toEqual(expectedResult)
  })  

  it("should parse nested groups", () => {
    const mock = `%{Группа1}
\t#{Группа2}
\t\t{Элемент1}`

    const expectedResult: TUsualGroup = {
      elementType: ZElementType.enum.UsualGroup,
      group: SE.ZColumnsGroup.enum.Horizontal,
      name: "Группа1",
      childItems: [
        {
          elementType: ZElementType.enum.UsualGroup,
          name: "Группа2",
          group: SE.ZColumnsGroup.enum.Vertical,
          childItems: [
            {
              elementType: ZElementType.enum.GroupContent,
              content: "Элемент1",
            },
          ],
        },
      ],
    }

    const result = parseTree(mock)

    expect(result).toEqual(expectedResult)
  })
})

// @ - картинка
// # - группа
// // - страницы
// / - страница
// : - поле ввода
// | - таблица
// <> - командная панель
// {} - свойства
// [] - флажок
// () - опции
// ; - элемент однострочной группы
//  - горизонтальная группа
// !"№%:,.;()"
