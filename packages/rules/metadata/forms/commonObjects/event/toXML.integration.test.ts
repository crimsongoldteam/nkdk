import { describe, expect, it } from "vitest"
import { importFromYAML, yamlMappingKeyTagAt } from "@nkdk/runtime"
import { ClientApplicationFormRules } from "../../clientApplicationForm/rules"
import { InputFieldRules } from "../../elements/inputField/rules"
import { testAtomicToXML } from "../../../../tests/property/atomicToXML"
import { mockContextFromXML, mockContextToXML } from "../../../../tests/mockContext"
import { createConfigurationIndexCollector } from "@nkdk/runtime"
import { createConfigurationIndexExportRuntime } from "@nkdk/runtime"
import { importEventsFromXML } from "./fromXML"
import { exportEventsToXML } from "./toXML"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { testConfigurationIndexReader } from "../../../../tests/configurationIndex"
import {
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../../tests/directConversion"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"

const eventRule = ClientApplicationFormRules.properties.events
const brokenEventUuid = "047d4d09-961c-4bdc-8519-eef10674c35b"
const eventProbeRule = {
  itemType: "EventBrokenReferenceProbe",
  properties: {
    events: { ...InputFieldRules.properties.events, yaml: "События", xml: "Events" },
  },
} as MetadataItemRule

function contextWithSnapshot() {
  const collector = createConfigurationIndexCollector()
  const source = testConfigurationIndexReader()
  const configurationIndex = createConfigurationIndexExportRuntime({
    source,
    collector,
    targetProjectPath: "Форма.yaml",
    logicalAddress: "Форма.События",
  })
  const baseContext = mockContextToXML()
  return {
    collector,
    context: {
      ...baseContext,
      exportToXML: { ...baseContext.exportToXML, configurationIndex },
    },
  }
}

describe("export Events to XML", () => {
  it("помечает UUID-имя события как битую ссылку, не определяя событие по обработчику", () => {
    const { yaml } = testPropertyFromXMLToYAML({
      rule: eventProbeRule,
      xml: {
        Events: {
          Event: { _name: brokenEventUuid, "#text": "ПослеЗаписи" },
        },
      },
    })
    const events = (yaml as { События: Record<string, unknown> }).События

    expect(events).toEqual({ [brokenEventUuid]: "ПослеЗаписи" })
    expect(yamlMappingKeyTagAt(events, brokenEventUuid)).toBe("xml/reference")
  })

  it("восстанавливает тегированный UUID дословно в Event.name", () => {
    const yaml = importFromYAML([
      "События:",
      `  !xml/reference ${brokenEventUuid}: ПослеЗаписи`,
    ].join("\n"))

    expect(testPropertyFromYAMLToXML({ rule: eventProbeRule, yaml }).xml).toEqual({
      Events: {
        Event: [{ _name: brokenEventUuid, "#text": "ПослеЗаписи" }],
      },
    })
  })

  it("восстанавливает все callType тегированного UUID дословно", () => {
    const yaml = importFromYAML([
      "События:",
      `  !xml/reference ${brokenEventUuid}:`,
      "    Перед: ПередОбработчиком",
      "    После: ПослеОбработчика",
    ].join("\n"))

    expect(testPropertyFromYAMLToXML({ rule: eventProbeRule, yaml }).xml).toEqual({
      Events: {
        Event: [
          { _name: brokenEventUuid, _callType: "Before", "#text": "ПередОбработчиком" },
          { _name: brokenEventUuid, _callType: "After", "#text": "ПослеОбработчика" },
        ],
      },
    })
  })

  it("отклоняет UUID-ключ без !xml/reference", () => {
    expect(() => testPropertyFromYAMLToXML({
      rule: eventProbeRule,
      yaml: { События: { [brokenEventUuid]: "ПослеЗаписи" } },
    })).toThrow("UUID-имя события должно быть помечено тегом !xml/reference")
  })

  it("отклоняет !xml/reference на произвольном имени события", () => {
    const yaml = importFromYAML("События:\n  !xml/reference НеUUID: Обработчик")

    expect(() => testPropertyFromYAMLToXML({ rule: eventProbeRule, yaml }))
      .toThrow("Тег !xml/reference у ключа не поддерживается типом свойства")
  })

  it("не помечает обычные известные и неизвестные текстовые события", () => {
    const { yaml } = testPropertyFromXMLToYAML({
      rule: eventProbeRule,
      xml: {
        Events: {
          Event: [
            { _name: "OnChange", "#text": "ПриИзменении" },
            { _name: "VendorEvent", "#text": "ОбработчикVendorEvent" },
          ],
        },
      },
    })
    const events = (yaml as { События: Record<string, unknown> }).События

    expect(events).toEqual({ ПриИзменении: "ПриИзменении", vendorEvent: "ОбработчикVendorEvent" })
    expect(yamlMappingKeyTagAt(events, "ПриИзменении")).toBeUndefined()
    expect(yamlMappingKeyTagAt(events, "vendorEvent")).toBeUndefined()
  })

  it("выгружает события в порядке ключей YAML, а не reference или снимка", () => {
    const { context, collector } = contextWithSnapshot()
    const rule = {
      type: "Events",
      items: { a: "A", b: "B" },
    } as PropertyRule

    expect(
      exportEventsToXML(
        context,
        rule,
        {
          a: {
            Before: "ПередA",
            After: "ПослеA",
          },
          b: "ОбработчикB",
        },
        {
          b: "ОбработчикB",
          a: {
            After: "ПослеA",
            Before: "ПередA",
          },
        }
      )
    ).toEqual({
      Event: [
        { _name: "A", _callType: "Before", "#text": "ПередA" },
        { _name: "A", _callType: "After", "#text": "ПослеA" },
        { _name: "B", "#text": "ОбработчикB" },
      ],
    })
    expect(JSON.stringify(collector.fragment("Форма.yaml").entities)).not.toMatch(/aliases|order/)
  })

  it("сохраняет порядок callType из YAML-объекта", () => {
    expect(
      exportEventsToXML(mockContextToXML(), eventRule, {
        onChange: {
          Override: "ВместоИзменения",
          After: "ПослеИзменения",
          Before: "ПередИзменением",
        },
      })
    ).toEqual({
      Event: [
        { _name: "OnChange", _callType: "Override", "#text": "ВместоИзменения" },
        { _name: "OnChange", _callType: "After", "#text": "ПослеИзменения" },
        { _name: "OnChange", _callType: "Before", "#text": "ПередИзменением" },
      ],
    })
  })

  it("сохраняет порядок YAML для обычных событий при другом порядке reference", () => {
    expect(
      exportEventsToXML(
        mockContextToXML(),
        InputFieldRules.properties.events,
        {
          autoComplete: "АвтоПодбор",
          onChange: "ПриИзменении",
        },
        {
          onChange: "ПриИзменении",
          autoComplete: "АвтоПодбор",
        }
      )
    ).toEqual({
      Event: [
        { _name: "AutoComplete", "#text": "АвтоПодбор" },
        { _name: "OnChange", "#text": "ПриИзменении" },
      ],
    })
  })

  it.each([
    [
      "обычное",
      { Event: { _name: "VendorEvent", "#text": "ОбработчикVendorEvent" } },
      { Event: [{ _name: "VendorEvent", "#text": "ОбработчикVendorEvent" }] },
    ],
    [
      "с одним callType",
      {
        Event: {
          _name: "VendorEvent",
          _callType: "Before" as const,
          "#text": "ПередVendorEvent",
        },
      },
      {
        Event: [
          {
            _name: "VendorEvent",
            _callType: "Before",
            "#text": "ПередVendorEvent",
          },
        ],
      },
    ],
  ])("делает no-reference round-trip неизвестного события: %s", (_description, xml, expected) => {
    const yaml = importEventsFromXML(mockContextFromXML(), InputFieldRules.properties.events, xml)

    expect(exportEventsToXML(mockContextToXML(), InputFieldRules.properties.events, yaml)).toEqual(expected)
  })

  it("заменяет неизвестную обычную reference-привязку режимной", () => {
    expect(
      exportEventsToXML(
        mockContextToXML(),
        eventRule,
        {
          vendorSpecificFormEvent: { Before: "ПередВендорскимСобытием" },
        },
        {
          vendorSpecificFormEvent: "ВендорскоеСобытие",
        }
      )
    ).toEqual({
      Event: [
        {
          _name: "vendorSpecificFormEvent",
          _callType: "Before",
          "#text": "ПередВендорскимСобытием",
        },
      ],
    })
  })

  it("exports form user settings update event with canonical XML case", () => {
    const { result } = testAtomicToXML({
      rule: ClientApplicationFormRules.properties.events,
      value: {
        onUpdateUserSettingSetAtServer: "ПриОбновленииСоставаПользовательскихНастроекНаСервере",
      },
      referenceMetadata: {
        onUpdateUserSettingSetAtServer: "ПриОбновленииСоставаПользовательскихНастроекНаСервере",
      },
      xmlRootTag: "Events",
    })

    expect(result).toEqual(
      "<Events>\n" +
        '\t<Event name="OnUpdateUserSettingSetAtServer">ПриОбновленииСоставаПользовательскихНастроекНаСервере</Event>\n' +
        "</Events>"
    )
  })

  it("exports form user settings load and save events with canonical XML case", () => {
    const { result } = testAtomicToXML({
      rule: ClientApplicationFormRules.properties.events,
      value: {
        onLoadUserSettingsAtServer: "ПриЗагрузкеПользовательскихНастроекНаСервере",
        onSaveUserSettingsAtServer: "ПриСохраненииПользовательскихНастроекНаСервере",
      },
      referenceMetadata: {
        onLoadUserSettingsAtServer: "ПриЗагрузкеПользовательскихНастроекНаСервере",
        onSaveUserSettingsAtServer: "ПриСохраненииПользовательскихНастроекНаСервере",
      },
      xmlRootTag: "Events",
    })

    expect(result).toEqual(
      "<Events>\n" +
        '\t<Event name="OnLoadUserSettingsAtServer">ПриЗагрузкеПользовательскихНастроекНаСервере</Event>\n' +
        '\t<Event name="OnSaveUserSettingsAtServer">ПриСохраненииПользовательскихНастроекНаСервере</Event>\n' +
        "</Events>"
    )
  })

  it("keeps unknown reference event names unchanged", () => {
    const { result } = testAtomicToXML({
      rule: ClientApplicationFormRules.properties.events,
      value: {
        vendorSpecificFormEvent: "ВендорскоеСобытие",
      },
      referenceMetadata: {
        vendorSpecificFormEvent: "ВендорскоеСобытие",
      },
      xmlRootTag: "Events",
    })

    expect(result).toEqual(
      "<Events>\n" + '\t<Event name="vendorSpecificFormEvent">ВендорскоеСобытие</Event>\n' + "</Events>"
    )
  })

  it("сохраняет нестандартное XML-имя известного события из reference", () => {
    const rule = ClientApplicationFormRules.properties.events
    const referenceMetadata = importEventsFromXML(mockContextFromXML({ forReference: true }), rule, {
      Event: {
        _name: "047d4d09-961c-4bdc-8519-eef10674c35b",
        "#text": "ПослеЗаписи",
      },
    })
    const { result } = testAtomicToXML({
      rule,
      value: { afterWrite: "ПослеЗаписи" },
      referenceMetadata,
      xmlRootTag: "Events",
    })

    expect(result).toContain('<Event name="047d4d09-961c-4bdc-8519-eef10674c35b">ПослеЗаписи</Event>')
  })
})
