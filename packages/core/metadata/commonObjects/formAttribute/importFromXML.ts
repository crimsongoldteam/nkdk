import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importTypeDescriptionFromXML } from "~/metadata/commonObjects/typeDescription/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importBooleanFromXML } from "../boolean/importFromXML"
import { importDynamicListFromXML } from "../dynamicList/importFromXML"
import { DynamicListXML } from "../dynamicList/types"
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

  const storedData = importBooleanFromXML(context, props.SavedData)
  if (storedData !== undefined) result.storedData = storedData

  // Check if Settings is a DynamicList (has _xsi:type indicating DynamicList) or TypeDescription
  if (props.Settings !== undefined) {
    const settingsAsAny = props.Settings as any
    if (settingsAsAny["_xsi:type"] === "DynamicList" || settingsAsAny["_xsi:type"] === "v8:DynamicList") {
      const dynamicList = importDynamicListFromXML(context, props.Settings as DynamicListXML)
      if (dynamicList !== undefined) result.settings = dynamicList
    } else {
      const settings = importTypeDescriptionFromXML(context, props.Settings)
      if (settings !== undefined) result.settings = settings
    }
  }

  const use = importUserVisibleFromXML(context, props.Use)
  if (use !== undefined) result.use = use

  return result
}
