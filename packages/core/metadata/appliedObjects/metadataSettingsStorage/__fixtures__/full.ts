import { MetadataSettingsStorage, MetadataSettingsStorageYAML } from "../types"

export const full: MetadataSettingsStorage = {
  itemType: "MetadataSettingsStorage",
  name: "ХранилищеНастроекВсеСвойства",
  synonym: { items: { ru: "Синоним" } },
  comment: "Комментарий",
  defaultSaveForm: "SettingsStorage.ХранилищеНастроекВсеСвойства.Form.ФормаСохранения",
  defaultLoadForm: "SettingsStorage.ХранилищеНастроекВсеСвойства.Form.ФормаЗагрузки",
}

export const fullYAML: MetadataSettingsStorageYAML = {
  Синоним: "Синоним",
  Комментарий: "Комментарий",
  ОсновнаяФормаСохранения: "ФормаСохранения",
  ОсновнаяФормаЗагрузки: "ФормаЗагрузки",
}
