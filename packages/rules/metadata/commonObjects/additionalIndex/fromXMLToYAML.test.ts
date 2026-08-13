import { describe, expect, it } from "vitest"

import {
  createDirectRoundTripContexts,
  readAppliedObjectFixture,
  testMetadataItemFromXMLToYAML,
} from "../../../tests/directConversion"
import { AdditionalIndexRules } from "./rules"

import "./types"

const expected = [
  {
    Имя: "Индекс1",
    Таблица: "Справочник.СправочникCоВсемиОбъектами",
    ИндексируемыеПоля: ["Ссылка"],
    ДополнительныеПоля: ["Наименование"],
  },
]

describe("AdditionalIndex XML → YAML", () => {
  it("imports full.xml", () => {
    const result = importFull()

    expect(result.yaml).toEqual(expected)
  })

  it("экспортирует items как корневой массив (без обёртки items:)", () => {
    const result = importFull()

    expect(result.yaml).toEqual(expected)
  })
})

function importFull() {
  const xml = readAppliedObjectFixture(import.meta.url, "full.xml")
  const contexts = additionalIndexContexts("СправочникCоВсемиОбъектами")
  return testMetadataItemFromXMLToYAML({ context: contexts.importContext, rule: AdditionalIndexRules, xml })
}

function additionalIndexContexts(ownerName: string) {
  return createDirectRoundTripContexts({
    metadataTargetOwners: [
      { itemType: "MetadataCatalog", name: ownerName, owner: { root: "Catalog", objectName: ownerName } },
    ],
  })
}
