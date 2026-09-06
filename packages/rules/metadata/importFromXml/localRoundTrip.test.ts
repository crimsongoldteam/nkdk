import {
  createXmlAnomalyAnnotations,
  parseXmlDocumentWithSaxes,
  type XmlElementNode,
} from "@nkdk/runtime"
import { createRuleRegistrySet, importPropertiesFromXMLToYAML, type MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { describe, expect, it } from "vitest"
import { metadataRules } from "../composition/metadataRules"
import { mockContextFromXML, mockContextToXML } from "../../tests/mockContext"
import { createImportLocalRoundTrip } from "./localRoundTrip"
import { createLocalIndexesCollector } from "../projectDefinition/localIndexes"

describe("import local round-trip", () => {
  it("восстанавливает атрибут из ключа коллекции без дополнительного raw", () => {
    const context = mockContextFromXML()
    const execution = createRuleRegistrySet(metadataRules).execution
    const annotations = createXmlAnomalyAnnotations()
    const roundTrip = createImportLocalRoundTrip({ execution, context: mockContextToXML(), annotations, decisions: [] })
    const rule: MetadataItemRule = { itemType: "KeyedFlagsProbe", properties: {
      flags: { type: "ChartOfAccountsPredefinedAccountingFlags", xml: "Flags", yaml: "Признаки" },
    } }
    const yaml = importPropertiesFromXMLToYAML({
      context, execution, rule, annotations, roundTrip, yamlPath: [], rulePath: [],
      collector: createLocalIndexesCollector(),
      sources: [{ context, xml: parseXmlDocumentWithSaxes('<Root><Flags><Flag ref="Флаг">false</Flag></Flags></Root>').roots[0]! }],
    })
    expect(yaml).toEqual({ Признаки: { Флаг: { Значение: "Ложь" } } })
  })

  it("открывает глубокую цепочку с линейным числом обходов стека", () => {
    const depth = 64
    const roots = nestedElements(depth)
    const execution = createRuleRegistrySet(metadataRules).execution
    const roundTrip = createImportLocalRoundTrip({
      execution,
      context: mockContextToXML(),
      annotations: createXmlAnomalyAnnotations(),
      decisions: [],
    })
    const rule: MetadataItemRule = { itemType: "LinearStackItem", properties: {} }
    const originalIterator = Array.prototype[Symbol.iterator]
    let iteratedValues = 0
    Array.prototype[Symbol.iterator] = (function* countedIterator<T>(this: T[]) {
      for (let index = 0; index < this.length; index++) {
        iteratedValues++
        yield this[index]!
      }
      return undefined
    }) as typeof Array.prototype[typeof Symbol.iterator]
    try {
      for (let index = 0; index < depth; index++) {
        roundTrip.open({
          context: mockContextFromXML(),
          rule,
          yaml: {},
          sources: [{ context: mockContextFromXML(), xml: roots[index]! }],
          yamlPath: [index],
          rulePath: [],
        })
      }
    } finally {
      Array.prototype[Symbol.iterator] = originalIterator
    }

    expect(iteratedValues).toBeLessThan(depth * 20)
  })
})

function nestedElements(depth: number): XmlElementNode[] {
  const document = parseXmlDocumentWithSaxes(`${"<Node>".repeat(depth)}${"</Node>".repeat(depth)}`)
  const result: XmlElementNode[] = []
  let current: XmlElementNode | undefined = document.roots[0]
  while (current !== undefined) {
    result.push(current)
    current = current.content.find((node): node is XmlElementNode => node.type === "element")
  }
  return result
}
