import { parseXmlWithSaxes } from "./saxesParser"

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

export type ImportContentFromXMLOptions = {
  preserveXsiNil?: true
  preserveEmptyElements?: true
}

export const importContentFromXML = <T>(
  data: string,
  importOptions: ImportContentFromXMLOptions = {}
): T => parseXmlWithSaxes<T>(data, importOptions)

export default importContentFromXML
