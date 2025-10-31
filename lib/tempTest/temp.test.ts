import { readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { TClientApplicationFormXML } from "../metadata/forms/elements/сlientApplicationForm/types"
import { it } from "vitest"
import { importClientApplicationFormFromXML } from "../metadata/forms/elements/сlientApplicationForm/importFromXML"
import xmlImport from "../xml/import/importer"
import "../metadata/forms/elements/usualGroup/registration"
import "../metadata/forms/elements/inputField/registration"
import "../metadata/forms/elements/page/registration"
import "../metadata/forms/elements/pages/registration"
import "../metadata/forms/elements/pictureDecoration/registration"
import "../metadata/forms/elements/labelDecoration/registration"
import "../metadata/forms/elements/button/registration"
import { formatClientApplicationForm } from "../metadata/forms/elements/сlientApplicationForm/format"

const originalContent = readFileSync(join(__dirname, "Form.xml"), "utf-8")

it("should test", () => {
  const importedXml = xmlImport<TClientApplicationFormXML>(originalContent)
  const form = importClientApplicationFormFromXML(importedXml)

  const text = formatClientApplicationForm(form, {}).strings.join("\n")

  console.log(text)

  // Сохраняем результат в файл out.txt
  writeFileSync(join(__dirname, "out.txt"), text, "utf-8")
})
