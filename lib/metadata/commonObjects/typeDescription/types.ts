export interface TypeDescriptionXMLSpreadsheetDocument {
  "_xmlns:mxl": "http://v8.1c.ru/8.2/data/spreadsheet"
  "#text": "mxl:SpreadsheetDocument"
}

export type TypeDescriptionXMLType =
  | string
  | TypeDescriptionXMLSpreadsheetDocument

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

export interface TypeDescription {
  type: string[]
  stringQualifiers?: TypeDescriptionStringQualifiers
  numberQualifiers?: TypeDescriptionNumberQualifiers
  dateQualifiers?: TypeDescriptionDateQualifiers
}
