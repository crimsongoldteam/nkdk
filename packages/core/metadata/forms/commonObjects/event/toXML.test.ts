import { describe, expect, it } from "vitest"
import { ClientApplicationFormRules } from "~/metadata/forms/clientApplicationForm/rules"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"

describe("export Events to XML", () => {
  it("exports form user settings update event with canonical XML case", () => {
    const { result } = testExportPropertyToXML({
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
    const { result } = testExportPropertyToXML({
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
    const { result } = testExportPropertyToXML({
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
})
