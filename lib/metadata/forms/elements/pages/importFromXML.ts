import { ZElementType } from "~/lib/metadata/systemEnumerations/types"
import { ImportFunction } from "~/lib/xml/import/types"
import { TPages, TPagesXML } from "./types"
import { importPageFromXML } from "../page/importFromXML"
import { TPage } from "../page/types"

export const importPagesFromXML: ImportFunction<TPages> = (xml: TPagesXML): TPages => {
  const result: TPages = {
    type: ZElementType.enum.Pages,
    name: xml.Pages._name,
    id: xml.Pages._id,
    childItems: xml.Pages.ChildItems?.map((item: TPage) => importPageFromXML(item)) ?? [],
  }
  return result
}
