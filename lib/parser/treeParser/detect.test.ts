import { describe, expect, it } from "vitest"
import { ZElementType } from "~/lib/metadata/forms/elements/types"
import { detectElementType } from "./detect"

// Правила определения элементов
// начинается с # - вертикальная группа
// начинается с // - страницы
// начинается с / - страница
// начинается с % - горизонтальная группа
// содержит : - поле ввода
// начинается с < - кнопка
// начинается с < и содержит | - командная панель
// содержит [] - флажок
// содержит () - радиокнопка
// содержит | - таблица
// все остальное - надпись

describe("detectElementType", () => {
  it("should detect input field containing :", () => {
    const mock = `text:`

    const result = detectElementType(mock)

    expect(result).toEqual(ZElementType.enum.InputField)
  })

  it("should detect vertical group starting with #", () => {
    const mock = `#VerticalGroup`

    const result = detectElementType(mock)

    expect(result).toEqual(ZElementType.enum.UsualGroup)
  })

  it("should detect pages starting with //", () => {
    const mock = `//Pages`

    const result = detectElementType(mock)

    expect(result).toEqual(ZElementType.enum.Pages)
  })

  it("should detect page starting with /", () => {
    const mock = `/Page`

    const result = detectElementType(mock)

    expect(result).toEqual(ZElementType.enum.Page)
  })

  it("should detect horizontal group starting with %", () => {
    const mock = `%HorizontalGroup`

    const result = detectElementType(mock)

    expect(result).toEqual(ZElementType.enum.UsualGroup)
  })

  it("should detect command bar starting with < and containing |", () => {
    const mock = `<Button1|Button2|Button3>`

    const result = detectElementType(mock)

    expect(result).toEqual(ZElementType.enum.CommandBar)
  })

  it("should detect button starting with <", () => {
    const mock = `<Button>`

    const result = detectElementType(mock)

    expect(result).toEqual(ZElementType.enum.Button)
  })

  it("should detect table containing |", () => {
    const mock = `Column1|Column2|Column3`

    const result = detectElementType(mock)

    expect(result).toEqual(ZElementType.enum.Table)
  })

  it("should detect label decoration for plain text", () => {
    const mock = `Plain Text Label`

    const result = detectElementType(mock)

    expect(result).toEqual(ZElementType.enum.LabelDecoration)
  })

  it("should handle empty string as label decoration", () => {
    const mock = ``

    const result = detectElementType(mock)

    expect(result).toEqual(ZElementType.enum.LabelDecoration)
  })

  it("should handle whitespace-only string as label decoration", () => {
    const mock = `   `

    const result = detectElementType(mock)

    expect(result).toEqual(ZElementType.enum.LabelDecoration)
  })

  it("should detect left titled radio button containing ()", () => {
    const mock = `RadioButton()`

    const result = detectElementType(mock)

    expect(result).toEqual(ZElementType.enum.RadioButtonField)
  })

  it("should detect left titled checkbox containing []", () => {
    const mock = `Checkbox[]`

    const result = detectElementType(mock)

    expect(result).toEqual(ZElementType.enum.CheckBoxField)
  })

  it("should detect right titled checkbox containing []", () => {
    const mock = `[]Some Text`

    const result = detectElementType(mock)

    expect(result).toEqual(ZElementType.enum.CheckBoxField)
  })

  it("should detect right titled radio button containing ()", () => {
    const mock = `()Some Text`

    const result = detectElementType(mock)

    expect(result).toEqual(ZElementType.enum.RadioButtonField)
  })
})
