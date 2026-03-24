import { ConfigurationContextWithExportToXML, ContextElementToXML } from "~/metadata/context/types"
import { setIdsToElements } from "~/metadata/forms/clientApplicationForm/toXML"
import { ElementXML, exportPropertyToXML, importPropertyFromXML, PropertyRule } from "~/metadata/orchestration"
import { xmlExport } from "~/xml/export/exporter"
import { mockContextFromXML, mockContextToXML } from "../mockContext"
import { readAndParseXMLFile, readXMLFileAsString } from "../readAndParseXMLFile"

export const testExportPropertyToXML = (params: {
  rule: PropertyRule
  value: unknown
  xmlRootTag: string
  path: string
  itemsTree?: ContextElementToXML[]
}): { expectedResult: string; result: string } => {
  const { rule, value, xmlRootTag, path } = params

  const expectedResult = readXMLFileAsString(path)

  const referenceXMLData = readAndParseXMLFile<{ [key: string]: ElementXML }>(path)
  const referenceXML = referenceXMLData
  const importContext = mockContextFromXML({ forReference: true })
  const referenceProperty = importPropertyFromXML({
    context: importContext,
    rule: rule,
    value: referenceXML[xmlRootTag],
  })

  const exportContext: ConfigurationContextWithExportToXML = {
    ...mockContextToXML(),
    exportToXML: {
      ...mockContextToXML().exportToXML,
      itemsTree: params.itemsTree ?? [],
      context: {
        forms: [],
        templates: [],
        parentName: "",
        metadataForNumbering: [],
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
