import { describe, expect, it } from "vitest"
import { lexer } from "../tokenizer/lexer"
import { tokenize } from "../tokenizer/tokenizer"
import { detectElementType } from "./detector"
import { ParseElementType } from "./types"

describe("detectElementType", () => {
  it("should detect input field containing :", () => {
    const mock = `text:`

    const tokens = tokenize(mock)

    const result = detectElementType(tokens)

    expect(result).toEqual(ParseElementType.InputField)
  })

  it("should detect vertical group starting with #", () => {
    const mock = `#VerticalGroup`

    const tokens = tokenize(mock)
    const result = detectElementType(tokens)

    expect(result).toEqual(ParseElementType.VerticalGroup)
  })

  it("should detect horizontal group starting with %", () => {
    const mock = `%HorizontalGroup`

    const tokens = tokenize(mock)
    const result = detectElementType(tokens)

    expect(result).toEqual(ParseElementType.HorizontalGroup)
  })

  it("should detect one line group when wrapped with %", () => {
    const mock = `%OneLineGroup%`

    const tokens = tokenize(mock)
    const result = detectElementType(tokens)

    expect(result).toEqual(ParseElementType.OneLineGroup)
  })

  it("should detect pages starting with //", () => {
    const mock = `//Pages`

    const tokens = tokenize(mock)
    const result = detectElementType(tokens)

    expect(result).toEqual(ParseElementType.Pages)
  })

  it("should detect page starting with /", () => {
    const mock = `/Page`

    const tokens = tokenize(mock)
    const result = detectElementType(tokens)

    expect(result).toEqual(ParseElementType.Page)
  })

  it("should detect command bar starting with < and containing |", () => {
    const mock = `<Button1|Button2|Button3> {name}`

    const tokens = tokenize(mock)
    const result = detectElementType(tokens)

    expect(result).toEqual(ParseElementType.CommandBar)
  })

  it("should detect button starting with <", () => {
    const mock = `<Button>`

    const tokens = tokenize(mock)
    const result = detectElementType(tokens)

    expect(result).toEqual(ParseElementType.Button)
  })

  it("should detect table containing |", () => {
    const mock = `Column1|Column2|Column3`

    const tokens = tokenize(mock)
    const result = detectElementType(tokens)

    expect(result).toEqual(ParseElementType.Table)
  })

  it("should detect label decoration for plain text", () => {
    const mock = `Plain Text Label`

    const tokens = tokenize(mock)
    const result = detectElementType(tokens)

    expect(result).toEqual(ParseElementType.LabelDecoration)
  })

  it("should handle empty string as label decoration", () => {
    const mock = ``

    const tokens = tokenize(mock)
    const result = detectElementType(tokens)

    expect(result).toEqual(ParseElementType.LabelDecoration)
  })

  it("should handle whitespace-only string as label decoration", () => {
    const mock = `   `

    const tokens = tokenize(mock)
    const result = detectElementType(tokens)

    expect(result).toEqual(ParseElementType.LabelDecoration)
  })

  it("should detect left titled checkbox containing []", () => {
    const mock = `Checkbox[]`

    const tokens = lexer.tokenize(mock).tokens
    const result = detectElementType(tokens)

    expect(result).toEqual(ParseElementType.LeftTitledCheckboxField)
  })

  it("should detect right titled checkbox containing []", () => {
    const mock = `[]Some Text`

    const tokens = tokenize(mock)
    const result = detectElementType(tokens)

    expect(result).toEqual(ParseElementType.RightTitledCheckboxField)
  })

  it("should detect left titled radio button containing ()", () => {
    const mock = `Radio button ()`

    const tokens = tokenize(mock)
    const result = detectElementType(tokens)

    expect(result).toEqual(ParseElementType.RadioButtonField)
  })

  it("should detect other fields beginning with ?", () => {
    const mock = `?ПолеПереключателя`

    const tokens = tokenize(mock)

    const result = detectElementType(tokens)

    expect(result).toEqual(ParseElementType.OtherField)
  })
})
