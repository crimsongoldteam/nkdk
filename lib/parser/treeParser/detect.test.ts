import { describe, expect, it } from "vitest"
import { ZElementType } from "~/lib/metadata/forms/elements/types"
import { detectElementType } from "./detect"
import { lexer } from "./lexer"

describe("detectElementType", () => {
  it("should detect input field containing :", () => {
    const mock = `text:`

    const tokens = lexer.tokenize(mock).tokens

    const result = detectElementType(tokens)

    expect(result).toEqual(ZElementType.enum.InputField)
  })

  it("should detect vertical group starting with #", () => {
    const mock = `#VerticalGroup`

    const tokens = lexer.tokenize(mock).tokens
    const result = detectElementType(tokens)

    expect(result).toEqual(ZElementType.enum.UsualGroup)
  })

  it("should detect pages starting with //", () => {
    const mock = `//Pages`

    const tokens = lexer.tokenize(mock).tokens
    const result = detectElementType(tokens)

    expect(result).toEqual(ZElementType.enum.Pages)
  })

  it("should detect page starting with /", () => {
    const mock = `/Page`

    const tokens = lexer.tokenize(mock).tokens
    const result = detectElementType(tokens)

    expect(result).toEqual(ZElementType.enum.Page)
  })

  it("should detect horizontal group starting with %", () => {
    const mock = `%HorizontalGroup`

    const tokens = lexer.tokenize(mock).tokens
    const result = detectElementType(tokens)

    expect(result).toEqual(ZElementType.enum.UsualGroup)
  })

  it("should detect command bar starting with < and containing |", () => {
    const mock = `<Button1|Button2|Button3>`

    const tokens = lexer.tokenize(mock).tokens
    const result = detectElementType(tokens)

    expect(result).toEqual(ZElementType.enum.CommandBar)
  })

  it("should detect button starting with <", () => {
    const mock = `<Button>`

    const tokens = lexer.tokenize(mock).tokens
    const result = detectElementType(tokens)

    expect(result).toEqual(ZElementType.enum.Button)
  })

  it("should detect table containing |", () => {
    const mock = `Column1|Column2|Column3`

    const tokens = lexer.tokenize(mock).tokens
    const result = detectElementType(tokens)

    expect(result).toEqual(ZElementType.enum.Table)
  })

  it("should detect label decoration for plain text", () => {
    const mock = `Plain Text Label`

    const tokens = lexer.tokenize(mock).tokens
    const result = detectElementType(tokens)

    expect(result).toEqual(ZElementType.enum.LabelDecoration)
  })

  it("should handle empty string as label decoration", () => {
    const mock = ``

    const tokens = lexer.tokenize(mock).tokens
    const result = detectElementType(tokens)

    expect(result).toEqual(ZElementType.enum.LabelDecoration)
  })

  it("should handle whitespace-only string as label decoration", () => {
    const mock = `   `

    const tokens = lexer.tokenize(mock).tokens
    const result = detectElementType(tokens)

    expect(result).toEqual(ZElementType.enum.LabelDecoration)
  })

  it("should detect left titled radio button containing ()", () => {
    const mock = `RadioButton()`

    const tokens = lexer.tokenize(mock).tokens
    const result = detectElementType(tokens)

    expect(result).toEqual(ZElementType.enum.RadioButtonField)
  })

  it("should detect left titled checkbox containing []", () => {
    const mock = `Checkbox[]`

    const tokens = lexer.tokenize(mock).tokens
    const result = detectElementType(tokens)

    expect(result).toEqual(ZElementType.enum.CheckBoxField)
  })

  it("should detect right titled checkbox containing []", () => {
    const mock = `[]Some Text`

    const tokens = lexer.tokenize(mock).tokens
    const result = detectElementType(tokens)

    expect(result).toEqual(ZElementType.enum.CheckBoxField)
  })

  it("should detect right titled radio button containing ()", () => {
    const mock = `()Some Text`

    const tokens = lexer.tokenize(mock).tokens
    const result = detectElementType(tokens)

    expect(result).toEqual(ZElementType.enum.RadioButtonField)
  })
})
