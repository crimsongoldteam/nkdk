import { describe, expect, it } from "vitest"
import { ClientApplicationFormRules } from "../../clientApplicationForm/rules"
import { InputFieldRules } from "../../elements/inputField/rules"
import { testAtomicToXML } from "../../../../tests/property/atomicToXML"
import { mockContextFromXML, mockContextToXML } from "../../../../tests/mockContext"
import { createConfigurationIndexCollector } from "@nkdk/runtime"
import { encodeConfigurationIndex } from "@nkdk/runtime"
import { createConfigurationIndexExportRuntime } from "@nkdk/runtime"
import { createConfigurationIndexReader, snapshotConfigurationIndex } from "@nkdk/runtime"
import { sampleSnapshot } from "@nkdk/runtime"
import { importEventsFromXML } from "./fromXML"
import { exportEventsToXML } from "./toXML"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"

const eventRule = ClientApplicationFormRules.properties.events

function contextWithSnapshot() {
  const collector = createConfigurationIndexCollector()
  const source = createConfigurationIndexReader(
    snapshotConfigurationIndex(encodeConfigurationIndex(sampleSnapshot()))
  )
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
