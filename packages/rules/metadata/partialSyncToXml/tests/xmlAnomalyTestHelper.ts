import {
  parseMetadataYaml,
  type XmlAnomalyRuntime,
} from "@nkdk/runtime"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { mockContextToXML } from "../../../tests/mockContext"
import {
  buildPreparedAssignmentXml,
  prepareXmlAnomalyAssignment,
} from "../../fullSyncToXml/xmlAnomalyAssignment"
import type { FullXmlSyncGeneratedDocument } from "../../fullSyncToXml/types"

const rootRule = {
  itemType: "PartialXmlAnomalyTestOwner",
  properties: {
    value: { type: "string", yaml: "Значение", xml: "Value" },
  },
} as const satisfies MetadataItemRule

const runtime: XmlAnomalyRuntime = {
  requiresImportant: () => false,
  allowsHiddenSingletonName: () => false,
  generateCompactRaw: () => undefined,
}

export function buildPartialXmlAnomalyTestDocument(): FullXmlSyncGeneratedDocument {
  const parsed = parseMetadataYaml('Значение: !xml/raw "01"\n')
  const anomaly = prepareXmlAnomalyAssignment({
    preparedYamlFile: {
      projectPath: "Объект/Один/Свойства.yaml",
      filePath: "/project/cf/Объект/Один/Свойства.yaml",
      role: "properties",
      owner: { dir: "Объект", name: "Один" },
      data: parsed.data,
      annotations: parsed.annotations,
      syntaxDiagnostics: [],
    },
    rootRule,
    itemName: "Один",
    runtime,
  })
  const xml = buildPreparedAssignmentXml({
    document: {
      declarationId: "partial-test-document",
      targetXmlPath: "Objects/One.xml",
      xml: { Root: { Value: "ordinary" } },
      deferred: [],
      rootRule,
      rawBoundaries: anomaly.rawBoundaries,
    },
    context: mockContextToXML(),
  })
  return {
    assignmentId: "partial-test-assignment",
    declarationId: "partial-test-document",
    targetXmlPath: "Objects/One.xml",
    content: new TextEncoder().encode(xml),
  }
}
