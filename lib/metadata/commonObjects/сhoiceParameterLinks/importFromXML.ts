import { TChoiceParameterLinks, TChoiceParameterLinksXML } from "./types"

const extractDataPath = (
  dataPath: string | { "#text"?: string; "_xsi:type"?: string }
): string => {
  if (typeof dataPath === "string") {
    return dataPath
  }
  return dataPath["#text"] ?? ""
}

export const importChoiceParameterLinksFromXML = (
  xml: TChoiceParameterLinksXML | undefined
): TChoiceParameterLinks => {
  if (!xml) return undefined

  // Проверяем, является ли это структурой с app:item (ChoiceParameters)
  if (!Array.isArray(xml)) {
    if ("app:item" in xml) {
      // Для app:item структуры мы не можем преобразовать в ChoiceParameterLink,
      // так как у нас нет dataPath. Возвращаем undefined.
      // Это может потребовать дополнительной обработки в будущем.
      return undefined
    }
    // Если это не массив и не app:item, значит это объект с xr:Link
    // Но по типу это не должно быть возможно, так что возвращаем undefined
    return undefined
  }

  // Обработка структуры с xr:Link (ChoiceParameterLinks)
  if (xml.length === 0) return undefined

  const links = xml.flatMap((linkContainer) => {
    if (!("xr:Link" in linkContainer)) return []
    const linkRaw = linkContainer["xr:Link"]
    const linkArray = Array.isArray(linkRaw) ? linkRaw : [linkRaw]

    return linkArray.map((link) => ({
      name: link["xr:Name"],
      dataPath: extractDataPath(link["xr:DataPath"]),
      valueChange: link["xr:ValueChange"],
    }))
  })

  return links.length > 0 ? links : undefined
}
