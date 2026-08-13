import { describe, expect, it } from "vitest"

import { serializeDirectXML, testMetadataItemFromYAMLToXML } from "../../../tests/directConversion"
import { MetadataTaskAddressingAttributeRules } from "./rules"

describe("MetadataTaskAddressingAttribute YAML → XML", () => {
  it("adds Fill defaults to a fresh addressing attribute", () => {
    const result = serializeDirectXML(
      testMetadataItemFromYAMLToXML({
        rule: MetadataTaskAddressingAttributeRules,
        name: "Исполнитель",
        yaml: { Тип: "Строка" },
      }).xml
    )

    expect(result).toContain("<FillFromFillingValue>false</FillFromFillingValue>")
    expect(result).toContain('<FillValue xsi:type="xs:string"/>')
  })
})
