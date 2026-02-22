/** Строка — допустимое имя метаданных в YAML: буква/подчёркивание в начале, далее буквы, цифры, подчёркивание */
export type MetadataNameYAML = string

export const METADATA_NAME_YAML_PATTERN = /^[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*$/

export function isMetadataNameYAML(s: string): s is MetadataNameYAML {
  return METADATA_NAME_YAML_PATTERN.test(s)
}
