import { ConfigurationContextWithExportToXML, ContextElementToXML } from "~/metadata/context/types"
import { setIdsToElements } from "~/metadata/forms/clientApplicationForm/toXML"
import {
  CollectableElement,
  ElementXML,
  exportElementToXML,
  exportPropertyToXML,
  importElementFromXML,
  importPropertyFromXML,
} from "~/metadata/orchestration"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { readAndParseXMLFile, readXMLFileAsString } from "./readAndParseXMLFile"

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

export const testExportPropertyToXML = (params: {
  context?: ConfigurationContextWithExportToXML
  rule: PropertyRule
  value: unknown
  xmlRootTag: string
  path: string
  itemsTree?: ContextElementToXML[]
}): { expectedResult: string; result: string } => {
  const { context, rule, value, xmlRootTag, path } = params

  const expectedResult = readXMLFileAsString(path)

  const referenceXMLData = readAndParseXMLFile<{ [key: string]: ElementXML }>(path)
  const referenceXML = referenceXMLData
  const importContext = mockContextFromXML({ forReference: true })
  const referenceProperty = importPropertyFromXML({
    context: importContext,
    rule: rule,
    value: referenceXML[xmlRootTag],
  })

  const exportContext = context ?? {
    ...mockContextToXML(),
    exportToXML: {
      ...mockContextToXML().exportToXML,
      itemsTree: params.itemsTree ?? [],
      context: {
        forms: [],
        templates: [],
        parentName: "",
        elementsMap: [],
      },
    },
  }

  const xmlData = exportPropertyToXML({
    context: exportContext,
    rule,
    value,
    referenceMetadata: referenceProperty,
  })

  setIdsToElements(exportContext)

  const result = xmlExport({ [xmlRootTag]: xmlData }, false)

  return { expectedResult, result }
}
