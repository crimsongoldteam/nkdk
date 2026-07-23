import { describe, expect, it } from "vitest"
import { testPropertyFromXMLToYAML, testPropertyFromYAMLToXML } from "../../../tests/directConversion"
import type { MetadataItemRule } from "../../orchestration"
import { MetadataSubsystemRules } from "./rules"

const rule = {
  itemType: "MetadataSubsystemContentProbe",
  properties: {
    content: MetadataSubsystemRules.properties.content,
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
  it.each(cases)("преобразует допустимые ссылки состава в обоих направлениях: $canonical", ({ canonical, yaml }) => {
    const imported = testPropertyFromXMLToYAML({
      rule,
      xml: { Properties: { Content: { "xr:Item": [canonical] } } },
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
})
