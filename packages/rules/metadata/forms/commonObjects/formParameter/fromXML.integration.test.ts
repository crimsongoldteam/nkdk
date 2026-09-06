import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockRule } from "../../../../tests/mockContext"
import { readAndParseXMLFile } from "../../../../tests/readAndParseXMLFile"
import { fullFormParameters, withoutTypeFormParameters } from "./__fixtures__/data"
import { importFormParametersFromXML } from "./fromXML"
import { FormParametersXML } from "./types"
import { readFileSync } from "node:fs"
import { parseStructuralXMLWithoutCompatibility } from "../../../../tests/structuralXML"

const fixturesDir = resolve(dirname(fileURLToPath(import.meta.url)), "__fixtures__")

describe("importFormParametersFromXML", () => {
  it.each([
    ["full.xml", fullFormParameters],
    ["withoutType.xml", withoutTypeFormParameters],
  ] as const)("читает параметры из структурных узлов: %s", (file, expected) => {
    const root = parseStructuralXMLWithoutCompatibility(`<Parameters>${readFileSync(resolve(fixturesDir, file), "utf8")}</Parameters>`)
    expect(importFormParametersFromXML(mockContextFromXML(), mockRule, root)).toEqual(expected)
  })

  it("should return undefined for undefined input", () => {
    const result = importFormParametersFromXML(mockContextFromXML(), mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should import form parameters correctly", () => {
    const xmlData = readAndParseXMLFile<{ Parameter: FormParametersXML }>("full.xml", fixturesDir)
    const result = importFormParametersFromXML(mockContextFromXML(), mockRule, xmlData)
    expect(result).toEqual(fullFormParameters)
  })

  it("should import form parameter without type", () => {
    const xmlData = readAndParseXMLFile<{ Parameter: FormParametersXML }>("withoutType.xml", fixturesDir)
    const result = importFormParametersFromXML(mockContextFromXML(), mockRule, xmlData)
    expect(result).toStrictEqual(withoutTypeFormParameters)
  })
})
