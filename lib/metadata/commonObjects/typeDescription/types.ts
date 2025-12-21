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
  "v8:AllowedSign"?: "Any" | "Nonnegative"
}

export interface TypeDescriptionXMLDateQualifiers {
  "v8:DateFractions"?: "Date" | "Time" | "DateTime"
}

export interface TypeDescriptionXMLItem {
  "v8:Type"?: TypeDescriptionXMLType | TypeDescriptionXMLType[]
  "v8:TypeSet"?: string
  "v8:StringQualifiers"?: TypeDescriptionXMLStringQualifiers
  "v8:NumberQualifiers"?: TypeDescriptionXMLNumberQualifiers
  "v8:DateQualifiers"?: TypeDescriptionXMLDateQualifiers
}

export type TypeDescriptionXML = TypeDescriptionXMLItem[]

export interface TypeDescriptionStringQualifiers {
  length: number
  allowedLength: "Variable" | "Fixed"
}

export interface TypeDescriptionNumberQualifiers {
  digits: number
  fractionDigits: number
  allowedSign?: "Any" | "Nonnegative"
}

export interface TypeDescriptionDateQualifiers {
  dateFractions?: "Date" | "Time" | "DateTime"
}

const PrimitiveTypeToEnterprise = {
  string: "Строка",
  decimal: "Число",
  date: "Дата",
  boolean: "Булево",
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

export type TypeDescriptionEnterprise = string

export const AppliedTypeToEnterprise = {
  Catalog: "Справочник",
  CatalogRef: "Справочник",
  Document: "Документ",
  DocumentRef: "Документ",
  Enum: "Перечисление",
  EnumRef: "Перечисление",
  ChartOfAccountsRef: "ПланСчетов",
  ChartOfCharacteristicTypesRef: "ПланВидовХарактеристик",
  Characteristic: "Характеристика",
  DefinedType: "ОпределяемыйТип",
  CommandGroup: "ГруппаКоманд",
  InformationRegister: "РегистрСведений",
} as const

export const AppliedTypeFromEnterprise = (name: string): AppliedType => {
  return Object.keys(AppliedTypeToEnterprise).find(
    (key) => AppliedTypeToEnterprise[key as AppliedType] === name
  ) as AppliedType
}

export type AppliedType = keyof typeof AppliedTypeToEnterprise
export type AppliedTypeEnterprise = (typeof AppliedTypeToEnterprise)[keyof typeof AppliedTypeToEnterprise]
