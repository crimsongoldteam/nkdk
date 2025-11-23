import { describe, expect, it } from "vitest"
import { ZElementType } from "~/lib/metadata/forms/elements/types"
import { TUsualGroup } from "~/lib/metadata/forms/elements/usualGroup/types"
import { parseTree } from "./parseTree"

describe("parseTree", () => {
  it("should one-line group", () => {
    const mock = `%Однострочная группа {ОднострочнаяГруппа}% {Элемент1}; {Элемент2}`

    const expectedResult: TUsualGroup = {
      elementType: ZElementType.enum.UsualGroup,
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
