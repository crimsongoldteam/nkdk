// Главный интерфейс для библиотеки nakidka-core
// Экспортирует все необходимые функции и типы для работы с формами

// XML импорт
export { default as xmlImport } from "./xml/import/importer"

// ClientApplicationForm
export { default as importClientApplicationFormFromXML } from "./metadata/forms/elements/сlientApplicationForm/importFromXML"
export { ZClientApplicationFormXML } from "./metadata/forms/elements/сlientApplicationForm/types"
export { formatClientApplicationForm } from "./metadata/forms/elements/сlientApplicationForm/format"

// Типы
export type {
  TClientApplicationForm,
  TClientApplicationFormXML,
} from "./metadata/forms/elements/сlientApplicationForm/types"

// InputField
export { default as importInputFieldFromXML } from "./metadata/forms/elements/inputField/importFromXML"
export { ZInputFieldXML } from "./metadata/forms/elements/inputField/types"
export { formatInputField } from "./metadata/forms/elements/inputField/format"

// Общие типы
export type { TInputField } from "./metadata/forms/elements/inputField/types"
export type { TI8nText } from "./metadata/types"
export type { IFormatterParams } from "./formatter/types"
