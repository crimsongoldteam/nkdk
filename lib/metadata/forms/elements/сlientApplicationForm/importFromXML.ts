import { TClientApplicationForm, TClientApplicationFormXML, TAttribute, TAttributeXML } from "./types"
import importAttributeFromXML from "./attributes/importFromXML"
import { ZElementType } from "../types"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importI8nTextFromXML"
import { importChildItemsFromXML } from "../childItems/importFromXML"

export const importClientApplicationFormFromXML = (xml: TClientApplicationFormXML): TClientApplicationForm => {
  const result: TClientApplicationForm = {
    elementType: ZElementType.enum.Form,
    autoCommandBar: xml.Form.AutoCommandBar
      ? {
          name: xml.Form.AutoCommandBar._name,
          id: xml.Form.AutoCommandBar._id,
        }
      : undefined,
    title: importI8nTextFromXML(xml.Form.Title),
    items: importChildItemsFromXML(xml.Form.ChildItems),
    attributes:
      xml.Form.Attributes?.map((attribute) =>
        "Attribute" in attribute ? importAttributeFromXML(attribute as TAttributeXML) : undefined
      ).filter((attr): attr is TAttribute => attr !== undefined) ?? [],
  }
  return result
}
