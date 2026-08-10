import fs from "fs"
import { dirname, join } from "path"
import type { HelpPropertyRule, PropertyRule } from "@nkdk/runtime/rule-kit"
import { registerMetadataXmlPrepareCapability } from "../../resourceTopology/adapters/capabilities"

export function prepareHelpXML(params: {
  rule: PropertyRule
  nkdkDir: string
}): Record<string, unknown> | undefined {
  const rule = params.rule as HelpPropertyRule
  const nkdkHelpDir = join(params.nkdkDir, rule.nkdkDir)
  if (!fs.existsSync(nkdkHelpDir)) return undefined

  const langs = fs
    .readdirSync(nkdkHelpDir)
    .filter((file) => file.endsWith(".html"))
    .map((file) => file.replace(/\.html$/, ""))
    .sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)))
  if (langs.length === 0) return undefined

  return {
    Help: {
      _xmlns: "http://v8.1c.ru/8.3/xcf/extrnprops",
      "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
      "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
      _version: "2.20",
      Page: langs.length === 1 ? langs[0] : langs,
    },
  }
}

registerMetadataXmlPrepareCapability({
  id: "Help",
  run: ({ assignment, preparedYamlFile, outputs }) => {
    const output = outputs.find((candidate) => candidate.role === "property")
    const propertyKey = output?.propertyName
    if (output === undefined || propertyKey === undefined) return []
    const propertyRule = assignment.itemRule.properties[propertyKey]
    if (propertyRule === undefined) return []
    const xml = prepareHelpXML({
      rule: propertyRule,
      nkdkDir: dirname(preparedYamlFile.filePath),
    })
    if (xml === undefined) return []
    return [
      {
        declarationId: output.declarationId,
        targetXmlPath: output.targetXmlPath,
        xml,
        deferred: [],
        rootRule: assignment.itemRule,
      },
    ]
  },
})
