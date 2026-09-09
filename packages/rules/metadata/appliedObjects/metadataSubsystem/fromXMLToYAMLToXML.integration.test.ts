import { parseMetadataYaml } from "@nkdk/runtime"
import { describe, expect, it } from "vitest"
import { testPropertyFromXMLToYAML, testPropertyFromYAMLToXML, testPropertyYamlRoundTrip, normalizeDirectRoundTripXML } from "../../../tests/directConversion"
import type { MetadataItemRule } from "../../ruleRuntime"
import { MetadataSubsystemRules } from "./rules"
import { xmlElementFromTestValue } from "../../../tests/structuralXML"

const rule = {
  itemType: "MetadataSubsystemContentProbe",
  properties: {
    content: MetadataSubsystemRules.properties.content,
  },
} satisfies MetadataItemRule

const childSubsystemsRule = {
  itemType: "MetadataSubsystemChildObjectsProbe",
  properties: {
    subsystems: MetadataSubsystemRules.properties.subsystems,
  },
} satisfies MetadataItemRule

const cases = [
  {
    canonical: "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Table.ТаблицаВсеСвойства",
    yaml: "ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства.Таблица.ТаблицаВсеСвойства",
  },
  {
    canonical: "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Cube.КубВсеСвойства",
    yaml: "ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства.Куб.КубВсеСвойства",
  },
  {
    canonical: "Subsystem.СтандартныеПодсистемы.Subsystem.АдресныйКлассификатор",
    yaml: "Подсистема.СтандартныеПодсистемы.Подсистема.АдресныйКлассификатор",
  },
  {
    canonical: "FunctionalOptionsParameter.ПараметрФункциональныхОпцийВсеСвойства",
    yaml: "ПараметрФункциональныхОпций.ПараметрФункциональныхОпцийВсеСвойства",
  },
  {
    canonical: "Sequence.ДокументыДвиженияИнвестиций",
    yaml: "Последовательность.ДокументыДвиженияИнвестиций",
  },
] as const

describe("MetadataSubsystem: единое преобразование состава", () => {
  it("импортирует все повторные элементы ChildObjects/Subsystem", () => {
    const imported = testPropertyFromXMLToYAML({
      rule: childSubsystemsRule,
      xml: { ChildObjects: { Subsystem: ["Первая", "Вторая"] } },
    })

    expect(imported.yaml).toEqual({ Подсистемы: ["Первая", "Вторая"] })
  })

  it.each(cases)("преобразует допустимые ссылки состава в обоих направлениях: $canonical", ({ canonical, yaml }) => {
    const imported = testPropertyFromXMLToYAML({
      rule,
      xml: xmlElementFromTestValue("Subsystem", { Properties: { Content: { "xr:Item": [canonical] } } }),
    })
    expect(imported.yaml).toEqual({ Состав: [yaml] })

    const exported = testPropertyFromYAMLToXML({
      rule,
      yaml: { Состав: [yaml] },
    })
    expect(exported.xml).toMatchObject({
      Properties: {
        Content: {
          "xr:Item": [expect.objectContaining({ "#text": canonical })],
        },
      },
    })
  })

  it("отклоняет ссылки на члены объектов в составе", () => {
    expect(() =>
      testPropertyFromYAMLToXML({
        rule,
        yaml: { Состав: ["Документ.АвансовыйОтчет.Реквизит.Организация"] },
      })
    ).toThrow('Неизвестный сегмент "Реквизит"')
  })

  it("сохраняет UUID состава только с !xml/uuid", () => {
    const uuid = "a786340b-1ca9-48ee-8517-6bd389390bcc"
    const parsed = parseMetadataYaml(["Состав:", `  - !xml/uuid ${uuid}`].join("\n"))

    const exported = testPropertyFromYAMLToXML({
      rule,
      yaml: parsed.data,
      annotations: parsed.annotations,
    })

    expect(exported.xml).toMatchObject({
      Properties: {
        Content: {
          "xr:Item": [expect.objectContaining({ "#text": uuid })],
        },
      },
    })
    expect(() => testPropertyFromYAMLToXML({
      rule,
      yaml: { Состав: [uuid] },
    })).toThrow("UUID metadata-ссылки требует !xml/uuid")
  })
})

 it("сохраняет пустой элемент состава между ссылками", () => {
   const result = testPropertyYamlRoundTrip({
     rule: MetadataSubsystemRules.properties.content,
     sourceXML: '<Root xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><Properties><Content><xr:Item xsi:type="xr:MDObjectRef">Report.First</xr:Item><xr:Item xsi:type="xr:MDObjectRef"/><xr:Item xsi:type="xr:MDObjectRef">Report.Last</xr:Item></Content></Properties></Root>',
   })
   expect(normalizeDirectRoundTripXML(result.result).replace(/>\s*</g, "><")).toBe(result.expected.replace(/>\s*</g, "><"))
 })

it("сохраняет UUID состава при полном round-trip через текст YAML", () => {
  const result = testPropertyYamlRoundTrip({
    rule: MetadataSubsystemRules.properties.content,
    sourceXML: '<Root xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><Properties><Content><xr:Item xsi:type="xr:MDObjectRef">a786340b-1ca9-48ee-8517-6bd389390bcc</xr:Item></Content></Properties></Root>',
  })
  expect(result.yamlText).toContain("!xml/uuid")
  expect(normalizeDirectRoundTripXML(result.result).replace(/>\s*</g, "><")).toBe(result.expected.replace(/>\s*</g, "><"))
})
