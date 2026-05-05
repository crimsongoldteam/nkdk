import fs from "fs"
import { basename, join } from "path"
import { convertFormFromXML } from "~/metadata/forms/clientApplicationForm/convertFromXML"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import type { SyncExternalFromXMLFunction } from "~/metadata/orchestration/property/fn"

/**
 * Сканирует `<xmlDir>/<name>/Forms/*.xml` и для каждого вызывает `convertFormFromXML`.
 * Формы обрабатываются последовательно внутри объекта.
 */
export const syncChildFormNamesFromXML: SyncExternalFromXMLFunction = async (params) => {
  const { context, xmlDir, nkdkDir, name } = params

  const formsDir = join(xmlDir, name, "Forms")
  if (!fs.existsSync(formsDir)) return

  const entries = await fs.promises.readdir(formsDir, { withFileTypes: true })
  const formNames = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".xml"))
    .map((e) => basename(e.name, ".xml"))

  for (const formName of formNames) {
    await convertFormFromXML({
      context,
      inputDir: formsDir,
      formName,
      outputDir: nkdkDir,
    })
  }
}

registerTypeRule("ChildFormNames", "syncExternalFromXML", syncChildFormNamesFromXML)
