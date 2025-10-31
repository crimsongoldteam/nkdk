import { readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { TClientApplicationFormXML } from "../metadata/forms/elements/сlientApplicationForm/types"
import { it } from "vitest"
import { importClientApplicationFormFromXML } from "../metadata/forms/elements/сlientApplicationForm/importFromXML"
import xmlImport from "../xml/import/importer"
import "../metadata/forms/elements/importFromXML"
import { ZClientApplicationFormXML } from "../metadata/forms/elements/сlientApplicationForm/types"

const originalContent = readFileSync(join(__dirname, "Form.xml"), "utf-8")

it("should test", () => {
  const importedXml = xmlImport<TClientApplicationFormXML>(originalContent, ZClientApplicationFormXML)
  const form = importClientApplicationFormFromXML(importedXml)

  //   const text = formatClientApplicationForm(form, {}).strings.join("\n")

  //   console.log(text)

  // Сохраняем результат в файл out.txt
  //   writeFileSync(join(__dirname, "out.txt"), text, "utf-8")
})
