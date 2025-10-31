import { TClientApplicationForm, TClientApplicationFormXML, TAttribute } from "./types"
import importAttributeFromXML from "./attributes/importFromXML"
import { importElementFromXML } from "~/lib/xml/import/importerFactory"
import { ZElementType } from "../types"
import { importI8nTextFromXML } from "~/lib/metadata/i8nText/importI8nTextFromXML"

export const importClientApplicationFormFromXML = (xml: TClientApplicationFormXML): TClientApplicationForm => {
  const result: TClientApplicationForm = {
    type: ZElementType.enum.Form,
    autoCommandBar: xml.Form.AutoCommandBar
      ? {
          name: xml.Form.AutoCommandBar._name,
          id: xml.Form.AutoCommandBar._id,
        }
      : undefined,
    title: importI8nTextFromXML(xml.Form.Title),
    items: xml.Form.ChildItems ? xml.Form.ChildItems.map((item) => importElementFromXML(item)) : [],
    attributes:
      xml.Form.Attributes?.map((attribute) => importAttributeFromXML(attribute)).filter(
        (attr): attr is TAttribute => attr !== undefined
      ) ?? [],
  }
  return result
}
