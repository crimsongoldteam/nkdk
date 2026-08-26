import { copyDoubleQuotedScalarMarks } from "./explicitString"
import { copyYAMLMappingKeyOrder } from "./mappingTags"
import { copyYAMLScalarTags } from "./scalarTags"

export function copyYAMLRuntimeMetadata(source: object, target: object): void {
  copySymbolProperties(source, target)
  copyYAMLScalarTags(source, target)
  copyYAMLMappingKeyOrder(source, target)
  copyDoubleQuotedScalarMarks(source, target)
}

export function cloneYAMLContainer<T extends object>(source: T): T {
  const target = Object.assign(Array.isArray(source) ? [] : {}, source) as T
  copyYAMLRuntimeMetadata(source, target)
  return target
}

function copySymbolProperties(source: object, target: object): void {
  for (const key of Object.getOwnPropertySymbols(source)) {
    const sourceDescriptor = Object.getOwnPropertyDescriptor(source, key)
    if (sourceDescriptor === undefined) continue
    const targetDescriptor = Object.getOwnPropertyDescriptor(target, key)
    if (targetDescriptor !== undefined && !sameSymbolValue(sourceDescriptor, targetDescriptor)) {
      throw new Error(`Несовместимая служебная Symbol-метка YAML: ${String(key)}`)
    }
    if (targetDescriptor !== undefined && targetDescriptor.configurable !== true) {
      if (!sameDescriptor(sourceDescriptor, targetDescriptor)) {
        throw new Error(`Несовместимая служебная Symbol-метка YAML: ${String(key)}`)
      }
      continue
    }
    Object.defineProperty(target, key, sourceDescriptor)
  }
}

function sameSymbolValue(left: PropertyDescriptor, right: PropertyDescriptor): boolean {
  if ("value" in left || "value" in right) {
    return "value" in left && "value" in right && Object.is(left.value, right.value)
  }
  return left.get === right.get && left.set === right.set
}

function sameDescriptor(left: PropertyDescriptor, right: PropertyDescriptor): boolean {
  return sameSymbolValue(left, right)
    && left.configurable === right.configurable
    && left.enumerable === right.enumerable
    && left.writable === right.writable
}
