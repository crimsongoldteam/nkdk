import { describe, expect, it } from "vitest"
import { withConfigurationIndexCollector } from "../../configurationIndex/collector/context"
import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import { importPropertiesFromXML } from "./fromXML"

const createContext = () => ({
  defaultLanguage: "ru",
  version: "2.20",
  fromXML: { forReference: false },
})

describe("importPropertiesFromXML configuration index collection", () => {
  it("collects XML-present properties in source order, aliases and significant presence", () => {
    const collector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(createContext(), collector, "Справочник.Товары")

    importPropertiesFromXML({
      context,
      rule: {
        itemType: "Catalog",
        properties: {
          rowFilter: {
            type: "string",
            xml: "RowFilter",
            fromXML: false,
            preserveFromReferenceXML: true,
          },
          title: {
            type: "string",
            xml: "Title",
            xmlAliases: ["Caption"],
          },
          explicitDefault: {
            type: "string",
            xml: "ExplicitDefault",
            defaultValueXML: "Авто",
            preserveExplicitDefaultXML: true,
          },
        },
      } as any,
      xml: {
        Caption: "Заголовок",
        RowFilter: {},
        ExplicitDefault: "Авто",
      },
    })

    expect(collector.fragment("Справочник/Товары/Свойства.yaml").xmlNodes).toEqual([
      {
        logicalAddress: "Справочник.Товары",
        order: ["title", "rowFilter", "explicitDefault"],
        aliases: { title: "Caption" },
        present: ["rowFilter", "explicitDefault"],
      },
    ])
  })

  it("сохраняет присутствие Color auto, которое теряется при импорте в модель", () => {
    const collector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(createContext(), collector, "Форма.Основная")

    const result = importPropertiesFromXML({
      context,
      rule: {
        itemType: "ClientApplicationForm",
        properties: {
          backgroundColor: { type: "Color", xml: "BackgroundColor" },
        },
      } as any,
      xml: { BackgroundColor: "auto" },
    })

    expect(result).toEqual({})
    expect(collector.fragment("Форма.yaml").xmlNodes).toEqual([
      {
        logicalAddress: "Форма.Основная",
        order: ["backgroundColor"],
        present: ["backgroundColor"],
      },
    ])
  })

  it("collects XML identity attributes on the current logical address", () => {
    const collector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(createContext(), collector, "Справочник.Товары")

    importPropertiesFromXML({
      context,
      rule: {
        itemType: "Catalog",
        properties: {
          uuid: { type: "string", xml: "_uuid", forReferenceOnly: true },
          id: { type: "string", xml: "_id", forReferenceOnly: true },
          name: { type: "string", xml: "_name" },
        },
      } as any,
      xml: {
        _uuid: "00000000-0000-4000-8000-000000000001",
        _id: "42",
        _name: "Товары",
      },
    })
    importPropertiesFromXML({
      context: withConfigurationIndexCollector(createContext(), collector, "Справочник.Товары.Значение[0]"),
      rule: {
        itemType: "Catalog",
        properties: { name: { type: "string", xml: "_name" } },
      } as any,
      xml: { _name: "НепредставимоеАдресомИмя" },
    })

    expect(collector.fragment("Справочник/Товары/Свойства.yaml").identities).toEqual([
      {
        logicalAddress: "Справочник.Товары",
        kind: "uuid",
        value: "00000000-0000-4000-8000-000000000001",
      },
      { logicalAddress: "Справочник.Товары", kind: "xmlId", value: "42" },
      {
        logicalAddress: "Справочник.Товары.Значение[0]",
        kind: "xmlName",
        value: "НепредставимоеАдресомИмя",
      },
    ])
  })

  it("не сохраняет XML-представление, полностью восстанавливаемое из Project и rules", () => {
    const collector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(createContext(), collector, "Отчёт.Продажи")

    importPropertiesFromXML({
      context,
      rule: {
        itemType: "Report",
        properties: {
          result: { type: "number", xml: "Result" },
          comment: { type: "string", xml: "Comment", defaultValueXMLEmpty: "" },
        },
      } as any,
      xml: {
        Result: { "_xsi:type": "xs:decimal", "#text": "3" },
        Comment: "",
      },
    })

    expect(collector.fragment("Отчёт/Продажи/Свойства.yaml").xmlValues).toEqual([])
  })

  it("сохраняет xsi:nil, потерянный моделью и не заданный rules", () => {
    const collector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(createContext(), collector, "РегистрСведений.Остатки")

    importPropertiesFromXML({
      context,
      rule: {
        itemType: "InformationRegister",
        properties: {
          sourceValue: { type: "MetadataValue", xml: "SourceValue" },
          canonicalNil: {
            type: "MetadataValue",
            xml: "CanonicalNil",
            defaultValueXMLRaw: { "_xsi:nil": true },
          },
        },
      } as any,
      xml: {
        SourceValue: { "_xsi:nil": true },
        CanonicalNil: { "_xsi:nil": true },
      },
    })

    expect(collector.fragment("РегистрСведений/Остатки/Свойства.yaml").xmlValues).toEqual([
      { logicalAddress: "РегистрСведений.Остатки.sourceValue", xsiNil: true },
    ])
  })
})
