import { expect } from "vitest"

import type { MetadataItemRule } from "../../ruleRuntime/property/types"
import { serializeDirectXML, testMetadataItemFromYAMLToXML } from "../../../tests/directConversion"

export function expectProcessingChildDefaults(rule: MetadataItemRule): void {
  const exported = testMetadataItemFromYAMLToXML({
    rule,
    name: "Проверка",
    yaml: {
      Реквизиты: { Верхний: { Тип: "Строка" } },
      ТабличныеЧасти: { Строки: { Реквизиты: { Вложенный: { Тип: "Строка" } } } },
    },
  })
  const result = serializeDirectXML(exported.xml)
  const [topAttribute = "", nestedAttribute = ""] = result.split("<Attribute").slice(1)

  expect(topAttribute).not.toMatch(/<(Indexing|FullTextSearch|DataHistory|FillFromFillingValue|FillValue)>/)
  expect(result).not.toContain("<LineNumberLength>")
  expect(nestedAttribute).toContain("<FillFromFillingValue>false</FillFromFillingValue>")
  expect(nestedAttribute).toContain('<FillValue xsi:nil="true"/>')
  expect(nestedAttribute).not.toMatch(/<(Indexing|FullTextSearch|DataHistory)>/)
}
