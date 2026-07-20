import { describe, expect, it } from "vitest"
import { createConfigurationIndexCollector } from "./writer"

describe("configuration index collector", () => {
  it("collects identity, order, aliases and explicit values by uid", () => {
    const collector = createConfigurationIndexCollector()
    collector.setUuid("Справочник.Товары", "00000000-0000-4000-8000-000000000001")
    collector.setOrder("Справочник.Товары", ["name", "synonym"])
    collector.setAlias("Справочник.Товары", "synonym", "Synonym")
    collector.setPresent("Справочник.Товары", "name")
    collector.setExplicitEmpty("Справочник.Товары.synonym")

    expect(collector.fragment("Справочник/Товары/Свойства.yaml")).toEqual({
      targetProjectPath: "Справочник/Товары/Свойства.yaml",
      identities: [
        {
          logicalAddress: "Справочник.Товары",
          kind: "uuid",
          value: "00000000-0000-4000-8000-000000000001",
        },
      ],
      xmlNodes: [
        {
          logicalAddress: "Справочник.Товары",
          order: ["name", "synonym"],
          aliases: { synonym: "Synonym" },
          present: ["name"],
        },
      ],
      xmlValues: [{ logicalAddress: "Справочник.Товары.synonym", explicitEmpty: true }],
    })
  })

  it("does not expose source XML, XML_REFERENCE_RAW, or collection order", () => {
    expect(Object.keys(createConfigurationIndexCollector())).not.toEqual(
      expect.arrayContaining(["setRawXml", "setXmlReferenceRaw", "setItemOrder"])
    )
  })

  it("collects all compact identity and XML value kinds deterministically", () => {
    const collector = createConfigurationIndexCollector()
    collector.setXmlName("Форма[0]", "ФормаЭлемента")
    collector.setXmlId("Форма[0]", "2")
    collector.setXsiNil("Форма[0].value")
    collector.setXsiType("Форма[0].value", "xs:string")
    collector.setXmlText("Форма[0].value", "Текст")
    collector.setXmlPrefix("Форма[0].value", "xs")
    collector.setUserSettingsId("Форма[0].value", "Настройка-1")

    expect(collector.fragment("Формы/ФормаЭлемента/Форма.yaml")).toEqual({
      targetProjectPath: "Формы/ФормаЭлемента/Форма.yaml",
      identities: [
        { logicalAddress: "Форма[0]", kind: "xmlId", value: "2" },
        { logicalAddress: "Форма[0]", kind: "xmlName", value: "ФормаЭлемента" },
      ],
      xmlNodes: [],
      xmlValues: [
        {
          logicalAddress: "Форма[0].value",
          xsiNil: true,
          xsiType: "xs:string",
          xmlText: "Текст",
          xmlPrefix: "xs",
          userSettingsId: "Настройка-1",
        },
      ],
    })
  })

  it("does not collect empty identity values", () => {
    const collector = createConfigurationIndexCollector()
    collector.setXmlName("Форма.Основная.КоманднаяПанель", "")
    collector.setXmlId("Форма.Основная.КоманднаяПанель", "")
    collector.setUuid("Форма.Основная.КоманднаяПанель", "")

    expect(collector.fragment("Форма.yaml").identities).toEqual([])
  })

  it("deduplicates equal logical-address values and rejects conflicting identities", () => {
    const collector = createConfigurationIndexCollector()
    collector.setUuid("Справочник.Товары", "00000000-0000-4000-8000-000000000001")
    collector.setUuid("Справочник.Товары", "00000000-0000-4000-8000-000000000001")

    expect(() => collector.setUuid("Справочник.Товары", "00000000-0000-4000-8000-000000000002")).toThrow(
      "Конфликт logicalAddress"
    )

    for (const [setIdentity, address] of [
      [(value: string) => collector.setXmlId("Форма[0]", value), "Форма[0]"],
      [(value: string) => collector.setXmlName("Форма[1]", value), "Форма[1]"],
    ] as const) {
      setIdentity("same")
      setIdentity("same")
      expect(() => setIdentity("other")).toThrow(`Конфликт logicalAddress ${address}`)
    }
  })

  it("deduplicates equal node and XML values and rejects conflicting replacements", () => {
    const collector = createConfigurationIndexCollector()
    collector.setOrder("Справочник.Товары", ["name", "synonym"])
    collector.setOrder("Справочник.Товары", ["name", "synonym"])
    expect(() => collector.setOrder("Справочник.Товары", ["synonym", "name"])).toThrow("Конфликт logicalAddress")

    collector.setAlias("Справочник.Товары", "synonym", "Synonym")
    collector.setAlias("Справочник.Товары", "synonym", "Synonym")
    expect(() => collector.setAlias("Справочник.Товары", "synonym", "Alias")).toThrow("Конфликт logicalAddress")

    for (const setValue of [
      (value: string) => collector.setXsiType("Справочник.Товары.value", value),
      (value: string) => collector.setXmlText("Справочник.Товары.value", value),
      (value: string) => collector.setXmlPrefix("Справочник.Товары.value", value),
      (value: string) => collector.setUserSettingsId("Справочник.Товары.value", value),
    ]) {
      setValue("same")
      setValue("same")
      expect(() => setValue("other")).toThrow("Конфликт logicalAddress")
    }
  })
})
