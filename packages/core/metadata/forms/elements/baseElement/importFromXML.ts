import { ConfigurationContext } from "~/metadata/context/types"
import { FormElementType, FromXMLType } from "../../../metadataFactory/types"
import { ImportExportReturn } from "../types"
import { BaseElement, BaseElementXML } from "./types"

export function importBaseElementFromXML<From extends BaseElementXML | undefined>(
  _context: ConfigurationContext,
  xml: From
): ImportExportReturn<From, FromXMLType<From>> {
  if (xml === undefined) return undefined

  return {
    name: xml._name,
    elementType: FormElementType.BaseElement,
  } as ImportExportReturn<From, FromXMLType<From>>
}
