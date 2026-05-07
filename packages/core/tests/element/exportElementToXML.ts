import { setIdsToElements } from "~/metadata/forms/clientApplicationForm/toXML"
import { FormAttribute } from "~/metadata/forms/commonObjects/formAttribute/types"
import { dynamicListFormAttributeQuery, rowFilterFormAttributeQuery } from "~/metadata/forms/elements/table/rules"
import { CollectableElement, ElementXML, exportElementToXML, importElementFromXML } from "~/metadata/orchestration"
import { CypherCache } from "~/metadata/orchestration/property/cypherCache"
import { getElementXMLTagName } from "~/metadata/orchestration/formElement/ruleFactory"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { readAndParseXMLFile, readXMLFileAsString } from "../readAndParseXMLFile"

export type TestExportElementToXMLParams<TElement extends CollectableElement = CollectableElement> = {
  element: TElement
  path: string
  baseDir?: string
  contextAttributes?: FormAttribute[]
}

export function testExportElementToXML<TElement extends CollectableElement>(
  params: TestExportElementToXMLParams<TElement>
): { expectedResult: string; result: string } {
  const { element, path, baseDir, contextAttributes } = params

  const xmlTagName = getElementXMLTagName(element.itemType)

  const expectedResult = readXMLFileAsString(path, baseDir)

  const referenceXMLData = readAndParseXMLFile<{ [key: string]: ElementXML }>(path, baseDir)
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
    const cache = new CypherCache()

    const dynamicListRows = getContextAttributeRowsByType(contextAttributes, "DynamicList")
    if (dynamicListRows.length > 0) {
      cache.set(dynamicListFormAttributeQuery, dynamicListRows)
    }

    const rowFilterRows = getRowFilterContextAttributeRows(contextAttributes)
    if (rowFilterRows.length > 0) {
      cache.set(rowFilterFormAttributeQuery, rowFilterRows)
    }

    context.exportToXML!.cypherCache = cache
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

function getContextAttributeRowsByType(
  contextAttributes: FormAttribute[],
  typeName: "DynamicList"
): Record<string, unknown>[] {
  return contextAttributes
    .filter(
      (attr) =>
        attr.itemType === "FormAttribute" &&
        Array.isArray(attr.type?.type) &&
        attr.type.type.includes(typeName)
    )
    .map((attr) => ({ name: attr.name }))
}

function getRowFilterContextAttributeRows(contextAttributes: FormAttribute[]): Record<string, unknown>[] {
  return contextAttributes
    .filter(
      (attr) =>
        attr.itemType === "FormAttribute" &&
        Array.isArray(attr.type?.type) &&
        !attr.type.type.includes("DynamicList") &&
        !attr.type.type.includes("ValueTree")
    )
    .map((attr) => ({ name: attr.name }))
}
