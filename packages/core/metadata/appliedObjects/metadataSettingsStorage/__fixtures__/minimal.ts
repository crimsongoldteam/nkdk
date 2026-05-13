import { MetadataSettingsStorage, MetadataSettingsStorageYAML } from "../types"

export const minimal: MetadataSettingsStorage = {
  itemType: "MetadataSettingsStorage",
  name: "ХранилищеНастроекПоУмолчанию",
  synonym: { items: { ru: "Хранилище настроек по умолчанию" } },
}

export const minimalYAML: MetadataSettingsStorageYAML = {
  Синоним: "Хранилище настроек по умолчанию",
}
