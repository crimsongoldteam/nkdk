import { readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { describe, it } from "vitest"
import z from "zod"
import { TClientApplicationFormXML, ZClientApplicationFormXML } from ".."
import { TConfigurationSettings } from "../metadata/configurationSettings/types"
import { formatClientApplicationForm } from "../metadata/forms/elements/clientApplicationForm/format"
import { importClientApplicationFormFromXML } from "../metadata/forms/elements/clientApplicationForm/importFromXML"
import "../metadata/forms/elements/exportToXML"
import "../metadata/forms/elements/importFromXML"
import "../metadata/forms/elements/rules"
import xmlImport from "../xml/import/importer"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

const originalContent = readFileSync(join(__dirname, "Form.xml"), "utf-8")

describe("DO test", () => {
  it("should round-trip DO XML", () => {
    const importedXml = xmlImport<{ Form: TClientApplicationFormXML }>(
      originalContent,
      z.object({ Form: ZClientApplicationFormXML })
    )
    const form = importClientApplicationFormFromXML(importedXml.Form)

    // const exportedForm = exportClientApplicationFormToXML(form)

    const formattedForm = formatClientApplicationForm(
      form,
      configurationSettings
    )

    // const exportedXml = xmlExport(
    //   { Form: exportedForm },
    //   z.object({ Form: ZClientApplicationFormXML })
    // )

    // writeFileSync(join(__dirname, "FormOut.xml"), exportedXml, "utf-8")
    writeFileSync(
      join(__dirname, "FormFormatted.txt"),
      formattedForm.strings.join("\n"),
      "utf-8"
    )
    // expect(exportedXml).toEqual(originalContent)
  })

  it("should round-trip DO with parsing", () => {
    const importedXml = xmlImport<{ Form: TClientApplicationFormXML }>(
      originalContent,
      z.object({ Form: ZClientApplicationFormXML })
    )
    const form = importClientApplicationFormFromXML(importedXml.Form)

    // const exportedForm = exportClientApplicationFormToXML(form)

    const formattedForm = formatClientApplicationForm(form, {})

    const parsedForm = parse(formattedForm.strings.join("\n"))

    const exportedXml = xmlExport(
      { Form: parsedForm },
      z.object({ Form: ZClientApplicationFormXML })
    )

    expect(exportedXml).toEqual(originalContent)
  })
})
