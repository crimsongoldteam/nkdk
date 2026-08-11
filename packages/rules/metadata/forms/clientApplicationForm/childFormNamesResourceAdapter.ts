import fs from "fs"
import { dirname, join } from "path"

import { defineMetadataXmlPrepareCapability } from "../../resourceTopology/adapters/capabilities"
import "./partialXmlPackage"

export const childFormNamesResourceCapabilityRules = defineMetadataXmlPrepareCapability({
  id: "ClientApplicationFormHelp",
  run: ({ assignment, preparedYamlFile, outputs }) => {
    const output = outputs.find((candidate) => candidate.role === "property")
    if (output === undefined) return []
    const helpDir = join(dirname(preparedYamlFile.filePath), "Справка")
    if (!fs.existsSync(helpDir)) return []
    const pages = fs
      .readdirSync(helpDir)
      .filter((file) => file.endsWith(".html"))
      .map((file) => file.replace(/\.html$/, ""))
      .sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)))
    if (pages.length === 0) return []
    return [
      {
        declarationId: output.declarationId,
        targetXmlPath: output.targetXmlPath,
        xml: {
          Help: {
            _xmlns: "http://v8.1c.ru/8.3/xcf/extrnprops",
            "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
            "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
            _version: "2.20",
            Page: pages.length === 1 ? pages[0] : pages,
          },
        },
        deferred: [],
        rootRule: assignment.itemRule,
      },
    ]
  },
})
