import { setIdsToElements } from "~/metadata/forms/clientApplicationForm/toXML"
import { CollectableElement, ElementXML, exportElementToXML, importElementFromXML } from "~/metadata/orchestration"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { readAndParseXMLFile, readXMLFileAsString } from "../readAndParseXMLFile"

export const testExportElementToXML = <TElement extends CollectableElement>(params: {
  element: TElement
  path: string
}): { expectedResult: string; result: string } => {
  const { element, path } = params

  const metadataType = element.itemType

  const expectedResult = readXMLFileAsString(path)

  const referenceXMLData = readAndParseXMLFile<{ [key: string]: ElementXML }>(path)
  const referenceXML = referenceXMLData[element.itemType]

  const importContext = mockContextFromXML({ forReference: true })
  const referenceElement = importElementFromXML({
    context: importContext,
    itemType: element.itemType,
    xml: referenceXML,
  }) as TElement | undefined

  const context = mockContextToXML()
  const xmlData = exportElementToXML({
    context,
    element,
    referenceElement,
  })

  setIdsToElements(context)

  const result = xmlExport({ [metadataType]: xmlData }, false)

  return { expectedResult, result }
}
