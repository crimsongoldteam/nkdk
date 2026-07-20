export function configurationUid(): string {
  return "Конфигурация"
}

export function metadataItemUid(kind: string, name: string): string {
  return `${segment(kind)}.${segment(name)}`
}

export function childUid(parent: string, kind: string, name: string): string {
  return `${address(parent)}.${segment(kind)}.${segment(name)}`
}

export function indexedUid(parent: string, kind: string, index: number): string {
  if (!Number.isSafeInteger(index) || index < 0) throw new Error("Некорректный индекс logicalAddress")
  return `${address(parent)}.${segment(kind)}[${index}]`
}

export function yamlPropertyUid(parent: string, propertyName: string): string {
  return `${address(parent)}.${segment(propertyName)}`
}

export function yamlKeyUid(parent: string, key: string): string {
  return `${address(parent)}.${segment(key)}`
}

export function yamlIndexUid(parent: string, index: number): string {
  if (!Number.isSafeInteger(index) || index < 0) throw new Error("Некорректный индекс logicalAddress")
  return `${address(parent)}[${index}]`
}

function address(value: string): string {
  if (value.length === 0) throw new Error("Пустой logicalAddress")
  return value
}

function segment(value: string): string {
  if (value.length === 0) throw new Error("Пустой сегмент logicalAddress")
  return value.replace(/%/g, "%25").replace(/\./g, "%2E").replace(/\[/g, "%5B").replace(/\]/g, "%5D")
}
