import { parseXmlDocumentWithSaxes } from "./saxesParser"
import type { ImportContentFromXMLOptions } from "./contracts"

export const I8N_TEXT_FIELDS = [
  "Title",
  "FooterText",
  "ToolTip",
  "Format",
  "EditFormat",
  "WarningOnEdit",
  "InputHint",
  "Presentation",
  "xr:Presentation",
  "Synonym",
  "Explanation",
  "ListPresentation",
  "ObjectPresentation",
  "ExtendedListPresentation",
  "ExtendedObjectPresentation",
]

export type { ImportContentFromXMLOptions } from "./contracts"

export const importContentFromXML = <T>(
  data: string,
  importOptions: ImportContentFromXMLOptions = {}
): T => parseXmlDocumentWithSaxes(data, importOptions).compatibility as T

export default importContentFromXML
