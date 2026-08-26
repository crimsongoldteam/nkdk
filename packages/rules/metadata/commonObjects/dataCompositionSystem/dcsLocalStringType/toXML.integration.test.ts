import { importFromYAML } from "@nkdk/runtime"
import {
  createPropertyRuleExecutor,
  createRuleRegistrySet,
  type MetadataItemRule,
} from "@nkdk/runtime/rule-kit"
import { describe,expect,it } from "vitest"
import {
  serializeDirectXML,
  testMetadataItemFromYAMLToXML,
  testPropertyFromYAMLToXML,
} from "../../../../tests/directConversion"
import { fixtureDcsLocalStringSingleLang, fixtureDcsLocalStringTwoLangs } from "./__fixtures__/data"
import { dcsLocalStringTypeRule } from "./types"
import { metadataRules } from "../../../composition/metadataRules"
import {
  createMetadataExecutionRegistrySets,
  withMetadataExecutionRegistrySets,
} from "../../../composition/metadataExecutionContext"

import "./fromYAML"
import "./toXML"

const rule = {
  itemType: "DcsLocalStringProbe",
  properties: {
    title: { type: "DcsLocalStringType", yaml: "Заголовок", xml: "dcsset:userSettingPresentation" },
  },
} as MetadataItemRule
const execution = createPropertyRuleExecutor(createRuleRegistrySet(metadataRules).property)

describe("DcsLocalStringType YAML → XML", () => {

  it("exports an ordinary scalar as one-language LocalStringType", () => {
    const xml = convert("Заголовок: Текст")

    expect(xml).toContain('<dcsset:userSettingPresentation xsi:type="v8:LocalStringType">')
    expect(xml).toContain("<v8:lang>ru</v8:lang>")
    expect(xml).toContain("<v8:content>Текст</v8:content>")
  })

  it("exports !xml/string as xs:string", () => {
    expect(convert("Заголовок: !xml/string Текст")).toContain(
      '<dcsset:userSettingPresentation xsi:type="xs:string">Текст</dcsset:userSettingPresentation>',
    )
  })

  it("exports a one-language mapping as LocalStringType", () => {
    const xml = serializeDirectXML(
      testPropertyFromYAMLToXML({
        rule,
        execution,
        yaml: { Заголовок: fixtureDcsLocalStringSingleLang.items },
      }).xml,
    )

    expect(xml).toContain('xsi:type="v8:LocalStringType"')
    expect(xml).not.toContain('xsi:type="xs:string"')
  })

  it("does not duplicate LocalStringType children from reference", () => {
    const nestedRule = {
      itemType: "DcsLocalStringReferenceProbe",
      properties: {
        title: dcsLocalStringTypeRule({
          xml: "dcsset:userSettingPresentation",
          yaml: "Заголовок",
        }),
      },
    } as const satisfies MetadataItemRule
    const xml = serializeDirectXML(withMetadataExecutionRegistrySets(
      createMetadataExecutionRegistrySets(metadataRules),
      () => testMetadataItemFromYAMLToXML({
        rule: nestedRule,
        yaml: { Заголовок: "Текст" },
        referenceXML: {
          "dcsset:userSettingPresentation": {
            "_xsi:type": "v8:LocalStringType",
            "v8:item": { "v8:lang": "ru", "v8:content": "Текст" },
          },
        },
      }).xml,
    ))

    expect(xml).toContain('<dcsset:userSettingPresentation xsi:type="v8:LocalStringType">')
    expect(xml.match(/<v8:item>/g)).toHaveLength(1)
  })

  it("exports two languages as LocalStringType", () => {
    const xml = serializeDirectXML(
      testPropertyFromYAMLToXML({
        rule,
        execution,
        yaml: { Заголовок: fixtureDcsLocalStringTwoLangs.items },
      }).xml,
    )

    expect(xml).toContain('<dcsset:userSettingPresentation xsi:type="v8:LocalStringType">')
    expect(xml).toContain("English language - local string")
  })

  it("rejects !xml/string on an ordinary string property", () => {
    const ordinaryRule = {
      itemType: "OrdinaryStringProbe",
      properties: {
        presentation: {
          type: "string",
          yaml: "Представление",
          xml: "Presentation",
        },
      },
    } as const satisfies MetadataItemRule

    expect(() => testMetadataItemFromYAMLToXML({
      rule: ordinaryRule,
      yaml: importFromYAML("Представление: !xml/string Текст"),
    })).toThrow("Тег !xml/string недопустим для этого типа свойства")
  })
})

function convert(yaml: string): string {
  return serializeDirectXML(testPropertyFromYAMLToXML({ rule, execution, yaml: importFromYAML(yaml) }).xml)
}
