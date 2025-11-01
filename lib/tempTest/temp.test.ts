import { readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { it } from "vitest"
import { importClientApplicationFormFromXML } from "../metadata/forms/elements/clientApplicationForm/importFromXML"
import xmlImport from "../xml/import/importer"
import "../metadata/forms/elements/importFromXML"
import xmlExport from "../xml/export/exporter"
import { exportClientApplicationFormToXML } from "../metadata/forms/elements/clientApplicationForm/exportToXML"
import { TClientApplicationFormXML, ZClientApplicationFormXML } from ".."

const originalContent = readFileSync(join(__dirname, "Form.xml"), "utf-8")

it("should round-trip test", () => {
  const importedXml = xmlImport<TClientApplicationFormXML>(originalContent, ZClientApplicationFormXML)
  const form = importClientApplicationFormFromXML(importedXml)

  const exportedForm = exportClientApplicationFormToXML(form)

  const exportedXml = xmlExport(exportedForm, ZClientApplicationFormXML)
  //   const text = formatClientApplicationForm(form, {}).strings.join("\n")

  console.log(form)

  // Сохраняем результат в файл out.txt
  writeFileSync(join(__dirname, "out.txt"), exportedXml, "utf-8")
})
