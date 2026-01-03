export interface TypeDescriptionXMLSpreadsheetDocument {
  "_xmlns:mxl": "http://v8.1c.ru/8.2/data/spreadsheet"
  "#text": "mxl:SpreadsheetDocument"
}

export type TypeDescriptionXMLType = string | TypeDescriptionXMLSpreadsheetDocument

export interface TypeDescriptionXMLStringQualifiers {
  "v8:Length": number
  "v8:AllowedLength": "Variable" | "Fixed"
}

export interface TypeDescriptionXMLNumberQualifiers {
  "v8:Digits": number
  "v8:FractionDigits": number
  "v8:AllowedSign": "Any" | "Nonnegative"
}

export interface TypeDescriptionXMLDateQualifiers {
  "v8:DateFractions"?: "Date" | "Time" | "DateTime"
}

export type TypeDescriptionXML = {
  "v8:Type"?: TypeDescriptionXMLType | TypeDescriptionXMLType[]
  "v8:TypeSet"?: TypeDescriptionXMLType
  "v8:StringQualifiers"?: TypeDescriptionXMLStringQualifiers
  "v8:NumberQualifiers"?: TypeDescriptionXMLNumberQualifiers
  "v8:DateQualifiers"?: TypeDescriptionXMLDateQualifiers
}

export interface TypeDescriptionStringQualifiers {
  length: number
  allowedLength: "Variable" | "Fixed"
}

export interface TypeDescriptionNumberQualifiers {
  digits: number
  fractionDigits: number
  allowedSign: "Any" | "Nonnegative"
}

export interface TypeDescriptionDateQualifiers {
  dateFractions?: "Date" | "Time" | "DateTime"
}

export const PrimitiveTypeToEnterprise = {
  string: "Строка",
  decimal: "Число",
  date: "Дата",
  boolean: "Булево",
  ValueStorage: "ХранилищеЗначения",
} as const

export const PrimitiveTypeFromEnterprise = (name: string): PrimitiveType => {
  return Object.keys(PrimitiveTypeToEnterprise).find(
    (key) => PrimitiveTypeToEnterprise[key as keyof typeof PrimitiveTypeToEnterprise] === name
  ) as PrimitiveType
}

export type PrimitiveType = keyof typeof PrimitiveTypeToEnterprise
export type PrimitiveTypeEnterprise = (typeof PrimitiveTypeToEnterprise)[keyof typeof PrimitiveTypeToEnterprise]

export interface TypeDescription {
  type: (PrimitiveType | string)[]
  stringQualifiers?: TypeDescriptionStringQualifiers
  numberQualifiers?: TypeDescriptionNumberQualifiers
  dateQualifiers?: TypeDescriptionDateQualifiers
}

export type TypeDescriptionEnterprise = string | string[]
