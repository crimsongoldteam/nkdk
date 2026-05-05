import { setIdsToElements } from "~/metadata/forms/clientApplicationForm/toXML"
import { FormAttribute } from "~/metadata/forms/commonObjects/formAttribute/types"
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
    const dynamicListQuery =
      'MATCH (s {id: $scope})-[:FORM_ATTRIBUTE]->(a:FormAttribute) WHERE "DynamicList" IN a.p_type_type RETURN a.name AS name'
    const rows = contextAttributes
      .filter(
        (attr) =>
          attr.itemType === "FormAttribute" &&
          Array.isArray(attr.type?.type) &&
          attr.type.type.includes("DynamicList")
      )
      .map((attr) => ({ name: attr.name }))
    const cache = new CypherCache()
    if (rows.length > 0) {
      cache.set(dynamicListQuery, rows as Record<string, unknown>[])
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
