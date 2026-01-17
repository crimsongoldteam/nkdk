import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importTypeDescriptionFromXML } from "~/metadata/commonObjects/typeDescription/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importBooleanFromXML } from "../boolean/importFromXML"
import { FormAttribute, FormAttributes, FormAttributesXML, FormAttributeXML } from "./types"

export const importFormAttributesFromXML = (
  context: ConfigurationContext,
  xml: FormAttributesXML | undefined
): FormAttributes | undefined => {
  if (!xml) return undefined

  const items = Array.isArray(xml) ? xml : [xml]

  return items.map((item) => importFormAttributeFromXML(context, item as FormAttributeXML))
}

const importFormAttributeFromXML = (context: ConfigurationContext, props: FormAttributeXML): FormAttribute => {
  const title = importI8nTextFromXML(context, props.Title) ?? { items: { [context.defaultLanguage]: "" } }

  const result: FormAttribute = {
    name: props._name,
    title,
  }

  const valueType = importTypeDescriptionFromXML(context, props.Type)!
  result.valueType = valueType

  const mainAttribute = importBooleanFromXML(context, props.MainAttribute)
  if (mainAttribute !== undefined) result.mainAttribute = mainAttribute

  const storedData = importBooleanFromXML(context, props.StoredData)
  if (storedData !== undefined) result.storedData = storedData

  const use = importUserVisibleFromXML(context, props.Use)
  if (use !== undefined) result.use = use

  return result
}
