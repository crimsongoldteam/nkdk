import { readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { expect, it } from "vitest"
import { importClientApplicationFormFromXML } from "../metadata/forms/elements/clientApplicationForm/importFromXML"
import xmlImport from "../xml/import/importer"
import "../metadata/forms/elements/importFromXML"
import xmlExport from "../xml/export/exporter"
import { exportClientApplicationFormToXML } from "../metadata/forms/elements/clientApplicationForm/exportToXML"
import { TClientApplicationFormXML, ZClientApplicationFormXML } from ".."
import z from "zod"

const originalContent = readFileSync(join(__dirname, "Form.xml"), "utf-8")

it("should round-trip test", () => {
  const importedXml = xmlImport<{ Form: TClientApplicationFormXML }>(
    originalContent,
    z.object({ Form: ZClientApplicationFormXML })
  )
  const form = importClientApplicationFormFromXML(importedXml.Form)

  const exportedForm = exportClientApplicationFormToXML(form)

  const exportedXml = xmlExport({ Form: exportedForm }, z.object({ Form: ZClientApplicationFormXML }))

  expect(exportedXml).toEqual(originalContent)
  // writeFileSync(join(__dirname, "out.txt"), exportedXml, "utf-8")
})
