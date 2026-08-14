import { describe, expect, it } from "vitest"

import { serializeDirectXML, testMetadataItemFromYAMLToXML } from "../../../tests/directConversion"
import { MetadataTaskAddressingAttributeRules } from "./rules"

describe("MetadataTaskAddressingAttribute YAML → XML", () => {
  it.each([
    ["очищенное", { Тип: "Строка", ИзмерениеАдресации: null }, ""],
    [
      "заполненное",
      { Тип: "Строка", ИзмерениеАдресации: "РегистрСведений.Адресация.Измерение.Исполнитель" },
      "InformationRegister.Адресация.Dimension.Исполнитель",
    ],
  ] as const)("экспортирует %s измерение адресации", (_name, yaml, expected) => {
    const result = testMetadataItemFromYAMLToXML({
      rule: MetadataTaskAddressingAttributeRules,
      name: "Исполнитель",
      yaml,
    }).xml

    expect((result.Properties as Record<string, unknown>).AddressingDimension).toBe(expected)
  })

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
