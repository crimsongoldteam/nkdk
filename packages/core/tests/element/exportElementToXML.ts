import { setIdsToElements } from "~/metadata/forms/clientApplicationForm/toXML"
import { FormAttribute } from "~/metadata/forms/commonObjects/formAttribute/types"
import { CollectableElement, ElementXML, exportElementToXML, importElementFromXML } from "~/metadata/orchestration"
import { getElementXMLTagName } from "~/metadata/orchestration/formElement/ruleFactory"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { readAndParseXMLFile, readXMLFileAsString } from "../readAndParseXMLFile"

export type TestExportElementToXMLParams<TElement extends CollectableElement = CollectableElement> = {
  element: TElement
  path: string
  baseDir?: string
  /** Мок-атрибуты формы для predicate'ов, читающих metadataForNumbering (например, isDynamicListAttribute) */
  contextAttributes?: FormAttribute[]
}

export function testExportElementToXML<TElement extends CollectableElement>(
  params: TestExportElementToXMLParams<TElement>
): { expectedResult: string; result: string } {
  const { element, path, baseDir, contextAttributes } = params

  const xmlTagName = getElementXMLTagName(element.itemType)

  const expectedResult = readXMLFileAsString(path, baseDir)

  const referenceXMLData = readAndParseXMLFile<{ [key: string]: ElementXML }>(path, baseDir)
  // Fixtures may use itemType as root tag (e.g. TableInputField) or xmlTag (e.g. CommandBarButton → Button)
  const metadataType = referenceXMLData[element.itemType] !== undefined ? element.itemType : xmlTagName
  const referenceXML = referenceXMLData[metadataType]

  const importContext = mockContextFromXML({ forReference: true })
  const referenceElement = importElementFromXML({
    context: importContext,
    itemType: element.itemType,
    xml: referenceXML,
  }) as TElement | undefined

  const context = mockContextToXML()

  if (contextAttributes) {
    for (const attr of contextAttributes) {
      context.exportToXML.context!.metadataForNumbering.push({
        element: attr,
        xmlElement: { _name: attr.name ?? "" },
      })
    }
  }

  const xmlData = exportElementToXML({
    context,
    element,
    referenceElement,
  })

  setIdsToElements(context)

  const result = xmlExport({ [metadataType]: xmlData }, false)

  return { expectedResult, result }
}
