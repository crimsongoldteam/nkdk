import { TTypeDescription, TTypeDescriptionXML } from "./types"

export default function importTypeDescriptionFromXML(xml: TTypeDescriptionXML): TTypeDescription {
  const typeArray = Array.isArray(xml["v8:Type"]) ? xml["v8:Type"] : [xml["v8:Type"]]
  const types = typeArray.map((type) => {
    if (type.startsWith("xs:")) {
      return type.substring(3)
    }
    if (type.startsWith("cfg:")) {
      return type.substring(4)
    }
    return type
  })

  const result: TTypeDescription = {
    type: types,
  }

  const stringQualifiers = processStringQualifiers(xml)
  if (stringQualifiers) {
    result.stringQualifiers = stringQualifiers
  }

  const numberQualifiers = processNumberQualifiers(xml)
  if (numberQualifiers) {
    result.numberQualifiers = numberQualifiers
  }

  const dateQualifiers = processDateQualifiers(xml)
  if (dateQualifiers) {
    result.dateQualifiers = dateQualifiers
  }

  return result
}

function processStringQualifiers(xml: TTypeDescriptionXML) {
  if (!xml["v8:StringQualifiers"]) return undefined

  return {
    length: xml["v8:StringQualifiers"]["v8:Length"],
    allowedLength: xml["v8:StringQualifiers"]["v8:AllowedLength"],
  }
}

function processNumberQualifiers(xml: TTypeDescriptionXML) {
  if (!xml["v8:NumberQualifiers"]) return undefined

  return {
    digits: xml["v8:NumberQualifiers"]["v8:Digits"],
    fractionDigits: xml["v8:NumberQualifiers"]["v8:FractionDigits"],
    allowedSign: xml["v8:NumberQualifiers"]["v8:AllowedSign"],
  }
}

function processDateQualifiers(xml: TTypeDescriptionXML) {
  if (!xml["v8:DateQualifiers"]) return undefined

  return {
    dateFractions: xml["v8:DateQualifiers"]["v8:DateFractions"],
  }
}
