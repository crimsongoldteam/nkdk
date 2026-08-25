import { describe, expect, it } from "vitest"
import {
  createXmlAnomalyAnnotations,
  createXmlImportAuditSession,
  parseXmlDocumentWithSaxes,
  projectXmlAuditRemainder,
  snapshotXmlAnomalyAnnotations,
} from "@nkdk/runtime"
import { testPropertyFromXMLToYAML } from "../../../../tests/directConversion"
import { testExportPropertyModelThroughXMLToYAML } from "../../../../tests/property/exportPropertyModelThroughXMLToYAML"
import { fullOrderExpressions, fullOrderExpressionsYAML } from "./__fixtures__/data"
import "./types"

describe("export CalculatedFieldOrderExpression to YAML", () => {
  it("привязывает повторные выражения к их точным XML-узлам", () => {
    const document = parseXmlDocumentWithSaxes(`
      <Probe>
        <dcssch:orderExpression><expression>Дата</expression><orderType>Asc</orderType><autoOrder>false</autoOrder></dcssch:orderExpression>
        <dcssch:orderExpression><expression>Номер</expression><orderType>Desc</orderType><autoOrder>true</autoOrder></dcssch:orderExpression>
      </Probe>
    `, { preserveXsiNil: true })
    const root = document.roots[0]!
    const audit = createXmlImportAuditSession([root])
    const annotations = createXmlAnomalyAnnotations()
    const result = testPropertyFromXMLToYAML({
      rule: {
        itemType: "CalculatedFieldOrderExpressionProbe",
        properties: {
          value: {
            type: "CalculatedFieldOrderExpression",
            yaml: "Выражения",
            xml: "dcssch:orderExpression",
          },
        },
      },
      xml: root,
      audit,
      annotations,
    })
    if (!isRecord(result.yaml)) throw new Error("Ожидался YAML выражений упорядочивания")
    const yaml = result.yaml

    projectXmlAuditRemainder({
      yaml,
      annotations,
      audit,
      root,
      boundary: { itemType: "CalculatedFieldOrderExpressionProbe", yamlPath: [], rulePath: [] },
    })
    audit.finalize()

    expect(yaml).toMatchObject({
      Выражения: [
        { Выражение: "Дата", ТипУпорядочивания: "Возр", Автоупорядочивание: "Ложь" },
        { Выражение: "Номер", ТипУпорядочивания: "Убыв", Автоупорядочивание: "Истина" },
      ],
    })
    expect(() => snapshotXmlAnomalyAnnotations(yaml, annotations)).not.toThrow()
  })

  it("exports full YAML", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule: { type: "CalculatedFieldOrderExpression", yaml: "ВыраженияУпорядочивания" },
      value: fullOrderExpressions,
      yaml: fullOrderExpressionsYAML,
    })

    expect(result).toEqual({ ВыраженияУпорядочивания: fullOrderExpressionsYAML })
  })
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
