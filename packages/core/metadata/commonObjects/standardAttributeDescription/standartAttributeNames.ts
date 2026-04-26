export const StandartAttributeNameToYAML = {
  Owner: "Владелец",
  PredefinedDataName: "ИмяПредопределенныхДанных",
  Code: "Код",
  Description: "Наименование",
  DeletionMark: "ПометкаУдаления",
  Predefined: "Предопределенный",
  Parent: "Родитель",
  Ref: "Ссылка",
  IsFolder: "ЭтоГруппа",
  LineNumber: "НомерСтроки",
  Active: "Активность",
  Recorder: "Регистратор",
  Period: "Период",
  Date: "Дата",
  Number: "Номер",
  Posted: "Проведен",
} as const

export type StandartAttributeName = keyof typeof StandartAttributeNameToYAML
export type StandartAttributeYAML = (typeof StandartAttributeNameToYAML)[keyof typeof StandartAttributeNameToYAML]

export const StandartAttributeNameFromYAML = (name: string): StandartAttributeName => {
  return Object.keys(StandartAttributeNameToYAML).find(
    (key) => StandartAttributeNameToYAML[key as StandartAttributeName] === name
  ) as StandartAttributeName
}
