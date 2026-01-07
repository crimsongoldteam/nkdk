import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { ChildItems, ChildItemsXML, ChildItemXML } from "./types"

export const importChildItemsFromXML = (context: ConfigurationContext, xml: ChildItemsXML | undefined): ChildItems => {
  if (!xml) return []

  let items: Array<Record<FormElementType, ChildItemXML>>

  if (Array.isArray(xml)) {
    items = xml
  } else {
    // Если это объект с несколькими ключами, преобразуем в массив объектов с одним ключом
    const keys = Object.keys(xml) as FormElementType[]
    if (keys.length === 1) {
      items = [xml]
    } else {
      items = keys.map((key) => ({ [key]: xml[key] }) as Record<FormElementType, ChildItemXML>)
    }
  }

  return items.map((item) => {
    const elementType = Object.keys(item)[0] as FormElementType
    const importFunction = getOperationFunction("ImportFromXML", elementType)
    if (!importFunction) throw new Error(`Import function not found for element type: ${elementType}`)
    return importFunction(context, item[elementType])!
  })
}
