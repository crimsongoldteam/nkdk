import { describe, expect, it } from "vitest"
import { ClientApplicationFormRules } from "../../clientApplicationForm/rules"
import { testAtomicToXML } from "../../../../tests/property/atomicToXML"
import { mockContextFromXML } from "../../../../tests/mockContext"
import { importEventsFromXML } from "./fromXML"

describe("export Events to XML", () => {
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
