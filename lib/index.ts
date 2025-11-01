// Главный интерфейс для библиотеки nakidka-core
// Экспортирует все необходимые функции и типы для работы с формами

// XML импорт
export { default as xmlImport } from "./xml/import/importer"
export { default as xmlExport } from "./xml/export/exporter"

// ClientApplicationForm
export { importClientApplicationFormFromXML } from "./metadata/forms/elements/clientApplicationForm/importFromXML"
export { exportClientApplicationFormToXML } from "./metadata/forms/elements/clientApplicationForm/exportToXML"
export { ZClientApplicationFormXML } from "./metadata/forms/elements/clientApplicationForm/types"
export { formatClientApplicationForm } from "./metadata/forms/elements/clientApplicationForm/format"

// Типы
export type {
  TClientApplicationForm,
  TClientApplicationFormXML,
} from "./metadata/forms/elements/clientApplicationForm/types"

// InputField
export { importInputFieldFromXML } from "./metadata/forms/elements/inputField/importFromXML"
export { ZInputFieldXML } from "./metadata/forms/elements/inputField/types"
export { formatInputField } from "./metadata/forms/elements/inputField/format"

// Общие типы
export type { TInputField } from "./metadata/forms/elements/inputField/types"
export type { TI8nText } from "./metadata/commonObjects/i8nText/types"
export type { IFormatterParams } from "./format/types"
