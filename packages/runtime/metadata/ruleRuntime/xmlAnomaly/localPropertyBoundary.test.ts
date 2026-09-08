import { describe, expect, it } from "vitest"
import { parseXmlDocumentWithSaxes } from "../../../xml/import/saxesParser"
import { xmlExport } from "../../../xml/export/exporter"
import { mergeXmlRawFragments } from "../../../xml/structure/merge"
import { createXmlAnomalyAnnotations } from "../../../yaml/xmlAnomalyAnnotations"
import { createLocalXmlProof } from "./localProof"
import { localXmlShapeFromObject } from "./localShape"
import { completeLocalXmlFragment } from "./localFragment"
import {
  projectLocalXmlPropertyDifferences,
  projectLocalXmlScalarDifference,
} from "./localPropertyBoundary"

function projectProperty(
  source: ReturnType<typeof parseXmlDocumentWithSaxes>["roots"][number],
  expectedName: string,
  actual: unknown,
  yaml: Record<string, unknown>,
) {
  const annotations = createXmlAnomalyAnnotations()
  const proof = createLocalXmlProof()
  proof.check(source, localXmlShapeFromObject(expectedName, actual), differences => {
    projectLocalXmlPropertyDifferences({
      parent: yaml, key: "Значение", annotations, source, expectedName,
      differences, hasSemanticValue: true, orderPath: [expectedName],
    })
  })
  return annotations
}

describe("локальное оформление XML-свойства", () => {
  it("восстанавливает лексическое значение минимальной поправкой", () => {
    const source = parseXmlDocumentWithSaxes("<Value>01</Value>").roots[0]!
    const yaml = { Значение: 1 }
    const annotations = projectProperty(source, "Value", "1", yaml)
    const annotation = annotations.at(yaml, "Значение")!
    expect(annotation.xml).toEqual({ "#text": "01" })
    const restored = mergeXmlRawFragments(parseXmlDocumentWithSaxes("<Root><Value>1</Value></Root>").roots, [{
      path: "Value", value: annotation.xml, suppressOrdinaryOutput: false, hasSemanticValue: true,
    }])
    expect(xmlExport(restored, false)).toBe("<Root>\n\t<Value>01</Value>\n</Root>")
  })

  it("восстанавливает исходный XML alias без raw всего элемента", () => {
    const source = parseXmlDocumentWithSaxes("<Alias>x</Alias>").roots[0]!
    const yaml = { Значение: "x" }
    const annotations = projectProperty(source, "Value", "x", yaml)
    const annotation = annotations.at(yaml, "Значение")!
    expect(annotation.xml).toEqual({ "#name": "Alias" })
    const restored = mergeXmlRawFragments(parseXmlDocumentWithSaxes("<Root><Value>x</Value></Root>").roots, [{
      path: "Value", value: annotation.xml, suppressOrdinaryOutput: false, hasSemanticValue: true,
    }])
    expect(xmlExport(restored, false)).toBe("<Root>\n\t<Alias>x</Alias>\n</Root>")
  })

  it("сохраняет неизвестного ребёнка внутри свойства вместе с необходимым порядком", () => {
    const source = parseXmlDocumentWithSaxes("<Value><Future>x</Future><Known>ok</Known></Value>").roots[0]!
    const yaml = { Значение: { Known: "ok" } }
    const annotations = createXmlAnomalyAnnotations()
    const proof = createLocalXmlProof()
    completeLocalXmlFragment({ source, name: "Value", value: { Known: "ok" }, proof, annotate: ({ differences }) => {
      projectLocalXmlPropertyDifferences({
        parent: yaml, key: "Значение", annotations, source, expectedName: "Value",
        differences, hasSemanticValue: true, orderPath: ["Value"],
      })
    } })
    const annotation = annotations.at(yaml, "Значение")!
    expect(annotation.xml).toEqual({ Future: "x", "#order": ["Future", "Known"] })
    expect(annotations.at(yaml, "Value\\#order")).toBeUndefined()
    const restored = mergeXmlRawFragments(parseXmlDocumentWithSaxes("<Root><Value><Known>ok</Known></Value></Root>").roots, [{
      path: "Value", value: annotation.xml, suppressOrdinaryOutput: false, hasSemanticValue: true,
    }])
    expect(xmlExport(restored, false)).toBe("<Root>\n\t<Value>\n\t\t<Future>x</Future>\n\t\t<Known>ok</Known>\n\t</Value>\n</Root>")
  })

  it("подавляет созданный атрибут у свойства без смыслового YAML-значения", () => {
    const source = parseXmlDocumentWithSaxes('<FillValue xsi:nil="true"/>').roots[0]!
    const yaml: Record<string, unknown> = {}
    const annotations = createXmlAnomalyAnnotations()
    const proof = createLocalXmlProof()
    proof.check(source, localXmlShapeFromObject("FillValue", {
      "_xsi:nil": "true",
      "_xsi:type": "xs:string",
    }), differences => {
      projectLocalXmlPropertyDifferences({
        parent: yaml, key: "ЗначениеЗаполнения", annotations, source,
        expectedName: "FillValue", differences, hasSemanticValue: false,
        orderPath: ["FillValue"],
      })
    })

    expect(annotations.at(yaml, "ЗначениеЗаполнения")?.xml).toEqual({
      "_xsi:nil": "true",
      "_xsi:type": null,
    })
  })

  it("восстанавливает значение XML-атрибута через его YAML-свойство", () => {
    const owner = parseXmlDocumentWithSaxes('<Root id="42"/>').roots[0]!
    const source = owner.attributes[0]!
    const yaml = { ИД: 43 }
    const annotations = createXmlAnomalyAnnotations()
    const proof = createLocalXmlProof()
    proof.checkValue(source, "43", difference => {
      projectLocalXmlScalarDifference({
        yaml, annotations, owner, source, difference, path: ["Root"],
      })
    })
    const annotation = annotations.at(yaml, "Root")!
    expect(annotation.xml).toEqual({ _id: "42" })
    const restored = mergeXmlRawFragments(parseXmlDocumentWithSaxes('<Document><Root id="43"/></Document>').roots, [{
      path: "Root", value: annotation.xml, suppressOrdinaryOutput: false, hasSemanticValue: true,
    }])
    expect(xmlExport(restored, false)).toBe('<Document>\n\t<Root id="42"/>\n</Document>')
  })
})
