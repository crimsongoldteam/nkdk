import { describe, expect, it } from "vitest"
import { TTypeDescription } from "./types"
import { formatTypeDescription } from "./formatTypeDescription"

it("should format undefined type description", () => {
  const result = formatTypeDescription(undefined)
  expect(result).toBeUndefined()
})

describe("string type description", () => {
  it("should format string", () => {
    const mockTypeDescription: TTypeDescription = {
      type: ["string"],
      stringQualifiers: { length: 10, allowedLength: "Variable" },
    }
    const expectedResult = "Строка(10)"

    const result = formatTypeDescription(mockTypeDescription)

    expect(result).toEqual(expectedResult)
  })

  it("should format unlimited string", () => {
    const mockTypeDescription: TTypeDescription = {
      type: ["string"],
      stringQualifiers: { length: 0, allowedLength: "Variable" },
    }
    const expectedResult = "Строка"

    const result = formatTypeDescription(mockTypeDescription)

    expect(result).toEqual(expectedResult)
  })

  it("should format fixed string", () => {
    const mockTypeDescription: TTypeDescription = {
      type: ["string"],
      stringQualifiers: { length: 100, allowedLength: "Fixed" },
    }
    const expectedResult = "ФиксированнаяСтрока(100)"

    const result = formatTypeDescription(mockTypeDescription)

    expect(result).toEqual(expectedResult)
  })
})

describe("number type description", () => {
  it("should format number", () => {
    const mockTypeDescription: TTypeDescription = {
      type: ["number"],
      numberQualifiers: { digits: 10, fractionDigits: 2 },
    }
    const expectedResult = "Число(10, 2)"

    const result = formatTypeDescription(mockTypeDescription)

    expect(result).toEqual(expectedResult)
  })

  it("should format non-negative number", () => {
    const mockTypeDescription: TTypeDescription = {
      type: ["number"],
      numberQualifiers: { digits: 10, fractionDigits: 2, allowedSign: "Nonnegative" },
    }
    const expectedResult = "НеотрицательноеЧисло(10, 2)"

    const result = formatTypeDescription(mockTypeDescription)

    expect(result).toEqual(expectedResult)
  })
})

describe("date type description", () => {
  it("should format date", () => {
    const mockTypeDescription: TTypeDescription = {
      type: ["date"],
      dateQualifiers: { dateFractions: "Date" },
    }

    const expectedResult = "Дата"

    const result = formatTypeDescription(mockTypeDescription)

    expect(result).toEqual(expectedResult)
  })

  it("should format time", () => {
    const mockTypeDescription: TTypeDescription = {
      type: ["date"],
      dateQualifiers: { dateFractions: "Time" },
    }

    const expectedResult = "Время"

    const result = formatTypeDescription(mockTypeDescription)

    expect(result).toEqual(expectedResult)
  })

  it("should format date and time", () => {
    const mockTypeDescription: TTypeDescription = {
      type: ["date"],
      dateQualifiers: { dateFractions: "DateTime" },
    }

    const expectedResult = "ДатаВремя"

    const result = formatTypeDescription(mockTypeDescription)

    expect(result).toEqual(expectedResult)
  })

  it("should format date", () => {
    const mockTypeDescription: TTypeDescription = {
      type: ["date"],
      dateQualifiers: { dateFractions: "Date" },
    }

    const expectedResult = "Дата"

    const result = formatTypeDescription(mockTypeDescription)

    expect(result).toEqual(expectedResult)
  })
})

describe("composite type description", () => {
  it("should format composite", () => {
    const mockTypeDescription: TTypeDescription = {
      type: ["тип1", "тип2"],
    }

    const expectedResult = "тип1, тип2"

    const result = formatTypeDescription(mockTypeDescription)

    expect(result).toEqual(expectedResult)
  })

  it("should format parametrical types composite", () => {
    const mockTypeDescription: TTypeDescription = {
      type: ["string", "number"],
      stringQualifiers: { length: 10, allowedLength: "Variable" },
      numberQualifiers: { digits: 10, fractionDigits: 2 },
    }

    const expectedResult = "Строка(10), Число(10, 2)"

    const result = formatTypeDescription(mockTypeDescription)

    expect(result).toEqual(expectedResult)
  })
})
