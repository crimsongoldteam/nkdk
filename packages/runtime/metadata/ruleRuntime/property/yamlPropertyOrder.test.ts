import { describe, expect, it } from "vitest"
import {
  createXmlAnomalyAnnotations,
  snapshotXmlAnomalyAnnotations,
} from "../../../yaml/xmlAnomalyAnnotations"
import { sortYamlRuleProperties } from "./yamlPropertyOrder"

describe("sortYamlRuleProperties", () => {
  it("переносит XML-аннотации на отсортированный объект без осиротевших записей", () => {
    const source = { Комментарий: "", Тип: "Строка" }
    const annotations = createXmlAnomalyAnnotations()
    annotations.set(source, "Комментарий", {
      kind: "raw",
      occurrence: 1,
      target: "value",
      xml: { "#text": "" },
      hasSemanticValue: false,
    })

    const sorted = sortYamlRuleProperties(source)

    expect(sorted).toBe(source)
    expect(snapshotXmlAnomalyAnnotations(sorted, annotations).entries).toEqual([
      expect.objectContaining({ parentPath: [], key: "Комментарий" }),
    ])
  })
})
