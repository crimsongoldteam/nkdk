import {
  markYAMLScalarTag,
  xmlScalarTagPayload,
  xmlScalarTagValue,
  yamlScalarTagAt,
} from "../../../yaml/scalarTags"

export function readExplicitElementXMLName(yaml: unknown): string | undefined {
  if (yaml === null || typeof yaml !== "object" || Array.isArray(yaml)) return undefined
  const item = yaml as Record<string, unknown>
  if (!Object.prototype.hasOwnProperty.call(item, "Имя")) return undefined
  if (yamlScalarTagAt(item, "Имя") !== "xml" || typeof item.Имя !== "string") {
    throw new Error("Поле Имя встроенного элемента допустимо только с тегом !xml")
  }
  return xmlScalarTagPayload(item.Имя)
}

export function writeExplicitElementXMLName(yaml: Record<string, unknown>, value: string): void {
  yaml.Имя = xmlScalarTagValue(value)
  markYAMLScalarTag(yaml, "Имя", "xml")
}
