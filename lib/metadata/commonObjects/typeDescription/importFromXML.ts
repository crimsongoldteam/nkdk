import {
  TTypeDescription,
  TTypeDescriptionXML,
  TTypeDescriptionXMLItem,
} from "./types"

export const importTypeDescriptionFromXML = (
  xml: TTypeDescriptionXML | TTypeDescriptionXML[number] | undefined
): TTypeDescription | undefined => {
  if (!xml) return undefined

  // Если это один объект, преобразуем в массив
  const xmlArray = Array.isArray(xml) ? xml : [xml]
  if (xmlArray.length === 0) return undefined

  const result: TTypeDescription = {
    type: [],
    stringQualifiers: undefined,
    numberQualifiers: undefined,
    dateQualifiers: undefined,
  }

  for (const item of xmlArray) {
    const typeValue = item["v8:Type"]
    result.type.push(...processType(typeValue))

    const stringQualifiers = processStringQualifiers(
      item["v8:StringQualifiers"]
    )
    if (stringQualifiers !== undefined) {
      result.stringQualifiers = stringQualifiers
    }
    const numberQualifiers = processNumberQualifiers(
      item["v8:NumberQualifiers"]
    )
    if (numberQualifiers !== undefined) {
      result.numberQualifiers = numberQualifiers
    }
    const dateQualifiers = processDateQualifiers(item["v8:DateQualifiers"])
    if (dateQualifiers !== undefined) {
      result.dateQualifiers = dateQualifiers
    }
  }

  return result
}

export const processType = (
  type:
    | TTypeDescriptionXMLItem["v8:Type"]
    | TTypeDescriptionXMLItem["v8:Type"][]
): string[] => {
  if (type === undefined) return []

  let typeArray = Array.isArray(type) ? type : [type]

  let result: string[] = []
  for (const typeItem of typeArray) {
    if (typeItem === undefined) continue
    let textValue: string | undefined
    if (typeof typeItem === "string") {
      textValue = typeItem
    } else if (typeof typeItem === "object" && "#text" in typeItem) {
      textValue = typeItem["#text"] as string | undefined
    }
    if (textValue === undefined) continue

    if (textValue.startsWith("xs:")) {
      result.push(textValue.substring(3))
    } else if (textValue.startsWith("cfg:")) {
      result.push(textValue.substring(4))
    } else if (textValue.startsWith("mxl:")) {
      result.push(textValue.substring(4))
    } else {
      result.push(textValue)
    }
  }

  return result
}

function processStringQualifiers(
  xml?: TTypeDescriptionXMLItem["v8:StringQualifiers"]
):
  | {
      length: number
      allowedLength: "Variable" | "Fixed"
    }
  | undefined {
  if (xml === undefined) return undefined
  return {
    length: xml["v8:Length"],
    allowedLength: xml["v8:AllowedLength"],
  }
}

function processNumberQualifiers(
  xml?: TTypeDescriptionXMLItem["v8:NumberQualifiers"]
) {
  if (!xml) return undefined

  return {
    digits: xml["v8:Digits"],
    fractionDigits: xml["v8:FractionDigits"],
    allowedSign: xml["v8:AllowedSign"],
  }
}

function processDateQualifiers(
  xml?: TTypeDescriptionXMLItem["v8:DateQualifiers"]
) {
  if (!xml) return undefined

  return {
    dateFractions: xml["v8:DateFractions"],
  }
}
