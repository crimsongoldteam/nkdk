import { describe, expect, it } from "vitest"

import { readAppliedObjectFixture, testMetadataItemFromXMLToYAML } from "../../../tests/directConversion"
import { AdditionalIndexRules } from "./rules"

import "./types"

const expected = [
  {
    Имя: "Индекс1",
    Таблица: "Catalog.СправочникCоВсемиОбъектами",
    ИндексируемыеПоля: ["Ref"],
    ДополнительныеПоля: ["Description"],
  },
]

describe("AdditionalIndex XML → YAML", () => {
  it("imports full.xml", () => {
    const xml = readAppliedObjectFixture(import.meta.url, "full.xml")
    const result = testMetadataItemFromXMLToYAML({ rule: AdditionalIndexRules, xml })

    expect(result.yaml).toEqual(expected)
  })

  it("экспортирует items как корневой массив (без обёртки items:)", () => {
    const xml = readAppliedObjectFixture(import.meta.url, "full.xml")
    const result = testMetadataItemFromXMLToYAML({ rule: AdditionalIndexRules, xml })

    expect(result.yaml).toEqual(expected)
  })
})
