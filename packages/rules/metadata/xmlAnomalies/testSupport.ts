import type { ParsedYaml, XmlAnomalyRuntime } from "@nkdk/runtime"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { prepareXmlAnomalyAssignment } from "../fullSyncToXml/xmlAnomalyAssignment"

export function prepareTestXmlAnomalyAssignment(params: {
  readonly parsed: ParsedYaml
  readonly rootRule: MetadataItemRule
  readonly runtime?: XmlAnomalyRuntime
  readonly mode?: "preserve" | "projectionOnly"
}) {
  return prepareXmlAnomalyAssignment({
    preparedYamlFile: {
      projectPath: "Объект/Один/Свойства.yaml",
      filePath: "/project/Объект/Один/Свойства.yaml",
      role: "properties",
      owner: { dir: "Объект", name: "Один" },
      data: params.parsed.data,
      annotations: params.parsed.annotations,
      syntaxDiagnostics: [],
    },
    rootRule: params.rootRule,
    itemName: "Один",
    ...(params.runtime === undefined ? {} : { runtime: params.runtime }),
    ...(params.mode === undefined ? {} : { mode: params.mode }),
  })
}
