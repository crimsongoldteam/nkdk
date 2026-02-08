import { ConfigurationContext } from "~/metadata/context/types"
import { importElementFromXML } from "~/metadata/metadataFactory"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ElementXML, FormElementType } from "~/metadata/metadataFactory/types"
import { NamedElement } from "../../elements/baseElement/types"
import { PropertyRule } from "../../elements/calendarField/rules"

type XMLItem<From extends NamedElement> = Record<From["elementType"], ElementXML>

export const importChildItemsFromXML = <From extends NamedElement>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  xml: XMLItem<From>[] | XMLItem<From> | undefined
): From[] => {
  if (!xml) return []

  const items = Array.isArray(xml) ? xml : [xml]

  const result: From[] = items.map((item) => {
    const elementType = Object.keys(item)[0] as FormElementType
    const xmlValue = (item as Record<string, any>)[elementType]
    return importElementFromXML({
      context: context,
      elementType: elementType,
      xml: xmlValue,
    })!
  })

  return result
}

registerTypeRule("ChildItems", "importFromXML", importChildItemsFromXML)
