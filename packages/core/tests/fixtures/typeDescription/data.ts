import { TypeDescription } from "../../../metadata/commonObjects/typeDescription/types"

//#region String

export const stringVariableTypeDescription: TypeDescription = {
  type: ["string"],
  stringQualifiers: { length: 10, allowedLength: "Variable" },
}

export const stringVariableTypeDescriptionEnterprise = "Строка(10)"

export const stringUnlimitedTypeDescription: TypeDescription = {
  type: ["string"],
  stringQualifiers: { length: 0, allowedLength: "Variable" },
}

export const stringUnlimitedTypeDescriptionEnterprise = "Строка"

export const stringUnlimitedTypeDescriptionWithoutQualifiers: TypeDescription = {
  type: ["string"],
}

export const stringUnlimitedTypeDescriptionWithoutQualifiersEnterprise = "Строка"

export const stringFixedTypeDescription: TypeDescription = {
  type: ["string"],
  stringQualifiers: { length: 100, allowedLength: "Fixed" },
}

export const stringFixedTypeDescriptionEnterprise = "ФиксированнаяСтрока(100)"

//#endregion

//#region Number

export const numberDecimalTypeDescription: TypeDescription = {
  type: ["decimal"],
  numberQualifiers: { digits: 10, fractionDigits: 2, allowedSign: "Any" },
}

export const numberDecimalTypeDescriptionEnterprise = "Число(10, 2)"

export const numberDecimalTypeDescriptionEnterpriseForImport = "Число(10,2)"

export const numberNonNegativeTypeDescription: TypeDescription = {
  type: ["decimal"],
  numberQualifiers: { digits: 10, fractionDigits: 2, allowedSign: "Nonnegative" },
}

export const numberNonNegativeTypeDescriptionEnterprise = "ПоложительноеЧисло(10, 2)"

export const numberNonNegativeTypeDescriptionEnterpriseForImport = "ПоложительноеЧисло(10,2)"

export const numberDecimalTypeDescriptionWithoutQualifiers: TypeDescription = {
  type: ["decimal"],
}

export const numberDecimalTypeDescriptionWithoutQualifiersEnterprise = "Число"
//#endregion

//#region Date
export const dateTypeDescription: TypeDescription = {
  type: ["dateTime"],
  dateQualifiers: { dateFractions: "Date" },
}

export const dateTypeDescriptionEnterprise = "Дата"

export const timeTypeDescription: TypeDescription = {
  type: ["dateTime"],
  dateQualifiers: { dateFractions: "Time" },
}

export const timeTypeDescriptionEnterprise = "Время"

export const dateTimeTypeDescription: TypeDescription = {
  type: ["dateTime"],
  dateQualifiers: { dateFractions: "DateTime" },
}

export const dateTimeTypeDescriptionEnterprise = "ДатаВремя"
//#endregion

//#region Boolean
export const booleanTypeDescription: TypeDescription = {
  type: ["boolean"],
}

export const booleanTypeDescriptionEnterprise = "Булево"
//#endregion

//#region Composite
export const compositeSimpleTypeDescription: TypeDescription = {
  type: ["тип1", "тип2"],
}

export const compositeSimpleTypeDescriptionEnterprise = ["тип1", "тип2"]

export const compositeParametricalTypeDescription: TypeDescription = {
  type: ["string", "decimal"],
  stringQualifiers: { length: 10, allowedLength: "Variable" },
  numberQualifiers: { digits: 10, fractionDigits: 2, allowedSign: "Any" },
}

export const compositeParametricalTypeDescriptionEnterprise = ["Строка(10)", "Число(10, 2)"]

export const compositeParametricalTypeDescriptionEnterpriseForImport = ["Строка(10)", "Число(10,2)"]
//#endregion

//#region Applied Objects
export const catalogTypeDescription: TypeDescription = {
  type: ["CatalogRef.Контрагенты"],
}

export const catalogTypeDescriptionEnterprise = "Справочник.Контрагенты"

export const documentTypeDescription: TypeDescription = {
  type: ["DocumentRef.ПоступлениеТоваровНаСклад"],
}

export const documentTypeDescriptionEnterprise = "Документ.ПоступлениеТоваровНаСклад"

export const enumTypeDescription: TypeDescription = {
  type: ["EnumRef.ТипыДокументов"],
}

export const enumTypeDescriptionEnterprise = "Перечисление.ТипыДокументов"

export const definedTypeDescription: TypeDescription = {
  type: ["DefinedType.GTIN"],
}

export const definedTypeDescriptionEnterprise = "ОпределяемыйТип.GTIN"

export const complexTypeDescription: TypeDescription = {
  type: ["boolean", "EnumRef.Статусы"],
}

export const threeTypesTypeDescription: TypeDescription = {
  type: ["CatalogRef.Сотрудники", "CatalogRef.Контрагенты", "CatalogRef.Пользователи"],
}

export const spreadsheetDocumentTypeDescription: TypeDescription = {
  type: ["SpreadsheetDocument"],
}

export const typeSetTypeDescription: TypeDescription = {
  type: ["Characteristic.ДополнительныеРеквизитыИСведения"],
}
//#endregion

//#region ValueStorage
export const valueStorageTypeDescription: TypeDescription = {
  type: ["ValueStorage"],
}

export const valueStorageTypeDescriptionEnterprise = "ХранилищеЗначения"
//#endregion
