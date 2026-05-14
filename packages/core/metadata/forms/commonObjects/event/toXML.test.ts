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
      '<Events>\n' +
        '\t<Event name="OnUpdateUserSettingSetAtServer">ПриОбновленииСоставаПользовательскихНастроекНаСервере</Event>\n' +
        "</Events>"
    )
  })
})
