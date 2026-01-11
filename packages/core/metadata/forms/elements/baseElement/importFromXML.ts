import { ConfigurationContext } from "~/metadata/context/types"
import { FormElementType } from "../../../metadataFactory/types"
import { ImportExportReturn } from "../types"
import { BaseElement, BaseElementXML } from "./types"

export const importBaseElementFromXML = <From extends BaseElementXML | undefined>(
  _context: ConfigurationContext,
  xml: From
): ImportExportReturn<From, BaseElement> => {
  if (!xml) return undefined as ImportExportReturn<From, BaseElement>

  return {
    name: xml._name,
    elementType: FormElementType.BaseElement,
  } as ImportExportReturn<From, BaseElement>
}
