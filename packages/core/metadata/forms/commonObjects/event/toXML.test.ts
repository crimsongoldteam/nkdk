import { describe, expect, it } from "vitest"
import { ClientApplicationFormRules } from "../../clientApplicationForm/rules"
import { InputFieldRules } from "../../elements/inputField/rules"
import { testAtomicToXML } from "../../../../tests/property/atomicToXML"
import { mockContextFromXML, mockContextToXML } from "../../../../tests/mockContext"
import { createConfigurationIndexCollector } from "../../../configurationIndex/collector/writer"
import { encodeConfigurationIndex } from "../../../configurationIndex/encode"
import { createConfigurationIndexExportRuntime } from "../../../configurationIndex/exportRuntime"
import { createConfigurationIndexReader, snapshotConfigurationIndex } from "../../../configurationIndex/sharedSnapshot"
import { sampleIndex } from "../../../configurationIndex/testData"
import { eventBindingKey } from "./callType"
import { importEventsFromXML } from "./fromXML"
import { exportEventsToXML } from "./toXML"

const eventRule = ClientApplicationFormRules.properties.events

function contextWithEventOrder(order: readonly string[]) {
  const collector = createConfigurationIndexCollector()
  const source = createConfigurationIndexReader(
    snapshotConfigurationIndex(
      encodeConfigurationIndex({
        ...sampleIndex(),
        xmlNodes: [...sampleIndex().xmlNodes, { logicalAddress: "Форма.События", order }],
      })
    )
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
  it("выгружает режимы вызова событий в порядке составных ключей снимка", () => {
    const { context } = contextWithEventOrder([
      eventBindingKey("onChange", "Before"),
      eventBindingKey("onChange", "After"),
      eventBindingKey("startChoice", "Override"),
    ])

    expect(
      exportEventsToXML(context, eventRule, {
        onChange: {
          Before: "ПередИзменением",
          After: "ПослеИзменения",
        },
        startChoice: {
          Override: "ВместоВыбора",
        },
      })
    ).toEqual({
      Event: [
        { _name: "OnChange", _callType: "Before", "#text": "ПередИзменением" },
        { _name: "OnChange", _callType: "After", "#text": "ПослеИзменения" },
        { _name: "StartChoice", _callType: "Override", "#text": "ВместоВыбора" },
      ],
    })
  })

  it("детерминированно упорядочивает режимы нового события", () => {
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
        { _name: "OnChange", _callType: "Before", "#text": "ПередИзменением" },
        { _name: "OnChange", _callType: "After", "#text": "ПослеИзменения" },
        { _name: "OnChange", _callType: "Override", "#text": "ВместоИзменения" },
      ],
    })
  })

  it("сохраняет порядок reference для обычных событий без снимка", () => {
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
        { _name: "OnChange", "#text": "ПриИзменении" },
        { _name: "AutoComplete", "#text": "АвтоПодбор" },
      ],
    })
  })

  it("восстанавливает смешанный порядок обычных и режимных привязок", () => {
    const order = [
      eventBindingKey("onChange", "After"),
      eventBindingKey("startChoice", "Override"),
      eventBindingKey("onChange", "Before"),
      eventBindingKey("autoComplete"),
    ]
    const { context, collector } = contextWithEventOrder(order)

    expect(
      exportEventsToXML(context, eventRule, {
        autoComplete: "АвтоПодбор",
        onChange: {
          Before: "ПередИзменением",
          After: "ПослеИзменения",
        },
        startChoice: { Override: "ВместоВыбора" },
      })
    ).toEqual({
      Event: [
        { _name: "OnChange", _callType: "After", "#text": "ПослеИзменения" },
        { _name: "StartChoice", _callType: "Override", "#text": "ВместоВыбора" },
        { _name: "OnChange", _callType: "Before", "#text": "ПередИзменением" },
        { _name: "AutoComplete", "#text": "АвтоПодбор" },
      ],
    })
    expect(collector.fragment("Форма.yaml").xmlNodes).toEqual([
      { logicalAddress: "Форма.События", order },
    ])
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
