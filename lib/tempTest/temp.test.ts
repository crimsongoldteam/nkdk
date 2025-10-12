import { readFileSync } from "fs"
import { join } from "path"
import { TClientApplicationFormXML } from "../metadata/forms/elements/сlientApplicationForm/types"
import { it } from "vitest"
import importClientApplicationFormFromXML from "../metadata/forms/elements/сlientApplicationForm/importFromXML"
import xmlImport from "../xml/import/importer"

const originalContent = readFileSync(join(__dirname, "Form.xml"), "utf-8")

it("should test", () => {
  const importedXml = xmlImport<TClientApplicationFormXML>(originalContent)
  const form = importClientApplicationFormFromXML(importedXml)
})
