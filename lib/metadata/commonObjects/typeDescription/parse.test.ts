import { describe, expect, it } from "vitest"
import { parseTypeDescription } from "./parse"

it("should parse undefined type description", () => {
  const result = parseTypeDescription(undefined)
  expect(result).toBeUndefined()
})

it("should parse empty string as undefined", () => {
  const result = parseTypeDescription("")
  expect(result).toBeUndefined()
})

it("should parse whitespace string as undefined", () => {
  const result = parseTypeDescription("   ")
  expect(result).toBeUndefined()
})

describe("string type description", () => {
  it("should parse string", () => {
    const input = "Строка(10)"
    const result = parseTypeDescription(input)

    expect(result).toEqual({
      type: ["string"],
      stringQualifiers: { length: 10, allowedLength: "Variable" },
    })
  })

  it("should parse unlimited string", () => {
    const input = "Строка"
    const result = parseTypeDescription(input)

    expect(result).toEqual({
      type: ["string"],
      stringQualifiers: { length: 0, allowedLength: "Variable" },
    })
  })

  it("should parse fixed string", () => {
    const input = "ФиксированнаяСтрока(100)"
    const result = parseTypeDescription(input)

    expect(result).toEqual({
      type: ["string"],
      stringQualifiers: { length: 100, allowedLength: "Fixed" },
    })
  })
})

describe("number type description", () => {
  it("should parse number", () => {
    const input = "Число(10, 2)"
    const result = parseTypeDescription(input)

    expect(result).toEqual({
      type: ["number"],
      numberQualifiers: { digits: 10, fractionDigits: 2 },
    })
  })

  it("should parse non-negative number", () => {
    const input = "ПоложительноеЧисло(10, 2)"
    const result = parseTypeDescription(input)

    expect(result).toEqual({
      type: ["number"],
      numberQualifiers: {
        digits: 10,
        fractionDigits: 2,
        allowedSign: "Nonnegative",
      },
    })
  })
})

describe("date type description", () => {
  it("should parse date", () => {
    const input = "Дата"
    const result = parseTypeDescription(input)

    expect(result).toEqual({
      type: ["date"],
      dateQualifiers: { dateFractions: "Date" },
    })
  })

  it("should parse time", () => {
    const input = "Время"
    const result = parseTypeDescription(input)

    expect(result).toEqual({
      type: ["date"],
      dateQualifiers: { dateFractions: "Time" },
    })
  })

  it("should parse date and time", () => {
    const input = "ДатаВремя"
    const result = parseTypeDescription(input)

    expect(result).toEqual({
      type: ["date"],
      dateQualifiers: { dateFractions: "DateTime" },
    })
  })
})

describe("composite type description", () => {
  it("should parse composite", () => {
    const input = "тип1, тип2"
    const result = parseTypeDescription(input)

    expect(result).toEqual({
      type: ["тип1", "тип2"],
    })
  })

  it("should parse parametrical types composite", () => {
    const input = "Строка(10), Число(10, 2)"
    const result = parseTypeDescription(input)

    expect(result).toEqual({
      type: ["string", "number"],
      stringQualifiers: { length: 10, allowedLength: "Variable" },
      numberQualifiers: { digits: 10, fractionDigits: 2 },
    })
  })
})
