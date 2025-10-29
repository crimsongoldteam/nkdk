import { TPage, TPageXML } from "./types"
import { ElementType } from "~/lib/metadata/systemEnumerations/types"
import { importElementFromXML } from "~/lib/xml/import/importerFactory"
import { TNamedElement } from "../baseElement/types"
import { ImportFunction } from "~/lib/xml/import/types"
import importI8nTextFromXML from "~/lib/metadata/i8nText/importI8nTextFromXML"

export const importPageFromXML: ImportFunction<TPage> = (xml: TPageXML): TPage => {
  const result: TPage = {
    type: ElementType.Page,
    name: xml.Page._name,
    title: xml.Page.Title ? importI8nTextFromXML(xml.Page.Title) : undefined,
    id: xml.Page._id,
    childItems: xml.Page.ChildItems?.map((item: TNamedElement) => importElementFromXML(item)) ?? [],
  }
  return result
}
