import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { fullDCSParameters, minimalDCSParameters } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = { type: "DCSParameter" }

const wrapFixture = (name: string) => {
  const inner = readFileSync(join(__dirname, "__fixtures__", name), "utf-8")
  return `<DcsParameterFixtures>${inner}</DcsParameterFixtures>`
}

describe("import DCSParameter from XML", () => {
  it("imports full.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlString: wrapFixture("full.xml"),
      xmlRootTag: "DcsParameterFixtures",
    })
    expect(result).toEqual(fullDCSParameters)
  })

  it("imports minimal.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlString: wrapFixture("minimal.xml"),
      xmlRootTag: "DcsParameterFixtures",
    })
    expect(result).toEqual(minimalDCSParameters)
  })
})
