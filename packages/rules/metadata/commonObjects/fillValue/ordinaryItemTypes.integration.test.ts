import { describe,expect,it } from "vitest"

import { testMetadataItemFromYAMLToXML } from "../../../tests/directConversion"
import { MetadataRegisterDimensionRules } from "../metadataRegisterDimension/rules"

describe("FillValue обычных полей", () => {

  it("экспортирует отсутствующее значение строкового измерения как xs:string", () => {
    const { xml } = testMetadataItemFromYAMLToXML({
      rule: MetadataRegisterDimensionRules,
      yaml: { Тип: "Строка" },
      name: "Поле",
    })

    expect(xml).toMatchObject({ Properties: { FillValue: { "_xsi:type": "xs:string" } } })
  })
})
