import { TTypeDescription, TTypeDescriptionXML } from "./types"

export default function exportTypeDescriptionToXML(typeDescription: TTypeDescription): TTypeDescriptionXML {
  const result: any = {}

  result["v8:Type"] = typeDescription.type.map(mapType)

  addStringQualifiers(result, typeDescription.stringQualifiers)
  addNumberQualifiers(result, typeDescription.numberQualifiers)
  addDateQualifiers(result, typeDescription.dateQualifiers)

  return result
}

function mapType(type: string): string {
  if (type === "string" || type === "decimal" || type === "date" || type === "boolean") {
    return `xs:${type}`
  }
  if (type.startsWith("EnumRef.")) {
    return `cfg:${type}`
  }
  return type
}

function addStringQualifiers(result: any, stringQualifiers: any) {
  if (stringQualifiers) {
    result["v8:StringQualifiers"] = {
      "v8:Length": stringQualifiers.length,
      "v8:AllowedLength": stringQualifiers.allowedLength,
    }
  }
}

function addNumberQualifiers(result: any, numberQualifiers: any) {
  if (numberQualifiers) {
    result["v8:NumberQualifiers"] = {
      "v8:Digits": numberQualifiers.digits,
      "v8:FractionDigits": numberQualifiers.fractionDigits,
      "v8:AllowedSign": numberQualifiers.allowedSign,
    }
  }
}

function addDateQualifiers(result: any, dateQualifiers: any) {
  if (dateQualifiers) {
    result["v8:DateQualifiers"] = {
      "v8:DateFractions": dateQualifiers.dateFractions,
    }
  }
}
