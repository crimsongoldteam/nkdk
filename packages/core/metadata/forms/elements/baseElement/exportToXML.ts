import { ConfigurationContext } from "~/metadata/context/types"
import { getElementId } from "~/metadata/helpers/getElementId"
import { sortObject } from "~/metadata/helpers/compactObject"
import { ImportExportReturn } from "../types"
import { BaseElement, BaseElementXML } from "./types"

export const exportBaseElementToXML = <T extends BaseElement | undefined>(
  context: ConfigurationContext,
  data: T
): ImportExportReturn<T, BaseElementXML> => {
  if (!data) return undefined as ImportExportReturn<T, BaseElementXML>

  const result: BaseElementXML = {
    _name: data.name,
    _id: getElementId(context),
  }

  return sortObject(result) as ImportExportReturn<T, BaseElementXML>
}
