import { describe, expect, it } from "vitest"
import { parseXmlDocumentWithSaxes, xmlAttributeValue, xmlElementChildren } from "@nkdk/runtime"
import type { ImportFromXMLToYAMLFunction, PropertyRule } from "@nkdk/runtime/rule-kit"
import "../../tests/metadataExecutionContext"
import { mockContextFromXML } from "../../tests/mockContext"
import { createLocalIndexesCollector } from "../projectDefinition/localIndexes"
import { importCalculatedFieldOrderExpressionFromXMLToYAML } from "../commonObjects/dataCompositionSystem/calculatedFieldOrderExpression/fromXMLToYAML"
import { importFormCommandsFromXMLToYAML } from "../forms/commonObjects/formCommand/fromXMLToYAML"
import { importFormAttributesFromXMLToYAML } from "../forms/commonObjects/formAttribute/fromXMLToYAML"
import { hasSoleValueListType } from "../forms/commonObjects/formAttribute/valueListSettings"
import { importChildItemsFromXMLToYAML } from "../forms/commonObjects/childItems/fromXMLToYAML"
import { importStandardAttributeDescriptionsFromXMLToYAML } from "../commonObjects/standardAttributeDescription/fromXMLToYAML"

const cases: readonly {
  name: string
  convert: ImportFromXMLToYAMLFunction
  rule: PropertyRule
  xml: string
  expected: object
}[] = [
  {
    name: "стандартные реквизиты", convert: importStandardAttributeDescriptionsFromXMLToYAML,
    rule: { type: "StandardAttributeDescriptions", standartAttributeNames: { RecordType: "ВидДвижения" } },
    xml: '<StandardAttributes><xr:StandardAttribute name="RecordType"/></StandardAttributes>',
    expected: { ВидДвижения: {} },
  },
  ...[
    { type: "GroupChildItems", xml: '<LabelField name="Поле" id="1"/>', kind: "ПолеНадписи" },
    { type: "TableChildItems", xml: '<InputField name="Поле" id="1"/>', kind: "ПолеВвода" },
    { type: "CommandBarChildItems", xml: '<Button name="Поле" id="1"><Type>CommandBarButton</Type></Button>', kind: "КнопкаКоманднойПанели" },
  ].map(({ type, xml, kind }) => ({
    name: type, convert: importChildItemsFromXMLToYAML, rule: { type },
    xml: `<ChildItems>${xml}</ChildItems>`, expected: { Поле: { Вид: kind } },
  })),
  {
    name: "выражения упорядочивания", convert: importCalculatedFieldOrderExpressionFromXMLToYAML,
    rule: { type: "CalculatedFieldOrderExpression" },
    xml: "<dcssch:orderExpression><expression>Дата</expression></dcssch:orderExpression>",
    expected: [{ Выражение: "Дата" }],
  },
  {
    name: "команды формы", convert: importFormCommandsFromXMLToYAML,
    rule: { type: "FormCommands" }, xml: '<Commands><Command name="Тест" id="1"><Action>Выполнить</Action></Command></Commands>',
    expected: { Тест: { Действие: "Выполнить" } },
  },
  {
    name: "реквизиты формы", convert: importFormAttributesFromXMLToYAML,
    rule: { type: "FormAttributes" }, xml: '<Attributes><Attribute name="Тест" id="1"/></Attributes>',
    expected: { Тест: {} },
  },
]

describe("структурные входы специализированных коллекций", () => {
  it.each([
    "", "<Type/>",
    "<Type><v8:Type>v8:ValueListType</v8:Type></Type>",
    "<Type><v8:Type> v8:ValueListType </v8:Type></Type>",
    "<Type><v8:Type>v8:ValueListType</v8:Type><v8:Type>xs:string</v8:Type></Type>",
    '<Type><v8:Type future="x">v8:ValueListType</v8:Type></Type>',
    "<Type><v8:Type><!--comment-->v8:ValueListType</v8:Type></Type>",
    "<Type><v8:Type>v8:ValueListType</v8:Type></Type><Type/>",
  ])("распознаёт единственный тип списка как прежний вход: %s", (xml) => {
    const root = parseXmlDocumentWithSaxes(`<Attribute>${xml}</Attribute>`).roots[0]!
    const expected = hasSoleValueListType(root.compatibilityValue)
    const nodes = [root]
    for (const node of nodes) {
      nodes.push(...xmlElementChildren(node))
      Object.defineProperty(node, "compatibilityValue", { get() { throw new Error("Не читать compatibility типа") } })
    }
    expect(hasSoleValueListType(root)).toBe(expected)
  })

  it.each(cases)("$name не читают compatibility контейнера и элементов", ({ convert, rule, xml, expected }) => {
    const root = parseXmlDocumentWithSaxes(xml).roots[0]!
    const guarded = [root, ...xmlElementChildren(root).filter(node => xmlAttributeValue(node, "name") !== undefined)]
    for (const node of guarded) {
      Object.defineProperty(node, "compatibilityValue", { get() { throw new Error("Не читать compatibility коллекции") } })
    }
    expect(convert({
      context: mockContextFromXML(), rule, xml: undefined,
      traversal: { yamlPath: [], rulePath: [], collector: createLocalIndexesCollector(), xmlNodes: [root] },
    })).toMatchObject(expected)
  })
})
