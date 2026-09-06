import {
  isPropertyStateYAMLTag,
  isXmlElementNode,
  xmlAttributeValue,
  type XmlElementNode,
  markYAMLScalarTag,
  yamlScalarTagAt,
  type ConfigurationContext,
  type ConfigurationContextFromXML,
} from "@nkdk/runtime"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { importTypeDescriptionFromXML } from "../../commonObjects/typeDescription/fromXML"
import { parseTypeDescriptionYAML } from "../../commonObjects/typeDescription/fromYAML"
import { exportTypeDescriptionToXML } from "../../commonObjects/typeDescription/toXML"
import { exportTypeDescriptionToYAML } from "../../commonObjects/typeDescription/toYAML"
import type {
  TypeDescriptionXML,
  TypeDescriptionYAML,
} from "../../commonObjects/typeDescription/types"

const GROUPS = ["xr:CheckValue", "xr:NotifyValue", "xr:ExtendValue"] as const
type MultiStateGroup = (typeof GROUPS)[number]
type ExtendedTypeDescriptionXML = TypeDescriptionXML & { "_xsi:type": "v8:TypeDescription" }

export type ExtendedPropertyXML = {
  "_xsi:type": "xr:ExtendedProperty"
} & Partial<Record<MultiStateGroup, ExtendedTypeDescriptionXML>>

export function importMultiStateType(
  context: ConfigurationContextFromXML,
  rule: PropertyRule | undefined,
  xml: unknown,
): TypeDescriptionYAML[] {
  const source = isXmlElementNode(xml) ? xml : asRecord(xml)
  const type = isXmlElementNode(source) ? xmlAttributeValue(source, "xsi:type") : source?.["_xsi:type"]
  if (source === undefined || type !== "xr:ExtendedProperty") {
    throw new Error("MultiState типа должен храниться как xr:ExtendedProperty")
  }

  const result: TypeDescriptionYAML[] = []
  for (const [xmlName, value] of typeGroups(source)) {
    const imported = importTypeDescriptionFromXML(context, rule, value)
    const yaml = exportTypeDescriptionToYAML(context, rule, imported)
    const parts = yaml === undefined ? [[]] : Array.isArray(yaml) ? yaml : [yaml]
    for (const part of parts) {
      const index = result.push(part as TypeDescriptionYAML) - 1
      const tag = groupTag(xmlName)
      if (tag !== undefined) markYAMLScalarTag(result, index, tag)
    }
  }
  return result
}

function* typeGroups(source: Record<string, unknown> | XmlElementNode): Iterable<readonly [MultiStateGroup, TypeDescriptionXML | XmlElementNode | undefined]> {
  if (isXmlElementNode(source)) {
    const groups = new Map<MultiStateGroup, XmlElementNode | undefined>()
    for (const child of source.content) {
      if (child.type !== "element" || !isMultiStateGroup(child.name)) continue
      // Повторная группа прежде читалась как массив без описания типа.
      groups.set(child.name, groups.has(child.name) ? undefined : child)
    }
    yield* groups
    return
  }
  for (const [name, value] of Object.entries(source)) {
    if (isMultiStateGroup(name)) yield [name, value as TypeDescriptionXML]
  }
}

export function exportMultiStateType(
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  yaml: readonly unknown[],
): { state: "MultiState"; value: ExtendedPropertyXML } {
  const values = new Map<MultiStateGroup, unknown[]>()
  for (let index = 0; index < yaml.length; index += 1) {
    const tag = yamlScalarTagAt(yaml, index)
    if (tag !== undefined && tag !== "проверять" && tag !== "изменять") {
      throw new Error(`Недопустимый тег части MultiState: ${tag}`)
    }
    const group: MultiStateGroup = tag === "проверять"
      ? "xr:NotifyValue"
      : tag === "изменять"
        ? "xr:ExtendValue"
        : "xr:CheckValue"
    const parts = values.get(group) ?? []
    parts.push(yaml[index])
    values.set(group, parts)
  }

  const value: ExtendedPropertyXML = { "_xsi:type": "xr:ExtendedProperty" }
  for (const [group, parts] of values) {
    const hasEmpty = parts.some(isEmptyPart)
    if (hasEmpty && (parts.length !== 1 || group !== "xr:CheckValue")) {
      throw new Error("Пустая часть MultiState допустима только как единственный CheckValue")
    }
    const description = hasEmpty ? undefined : parseTypeDescriptionYAML(parts)
    value[group] = {
      "_xsi:type": "v8:TypeDescription",
      ...exportTypeDescriptionToXML(context, rule, description),
    }
  }
  return { state: "MultiState", value }
}

export function isMultiStateTypeYAML(value: unknown): value is readonly unknown[] {
  return Array.isArray(value) && value.some((_, index) =>
    isPropertyStateYAMLTag(yamlScalarTagAt(value, index)) || isEmptyPart(value[index]))
}

function isEmptyPart(value: unknown): boolean {
  return Array.isArray(value) && value.length === 0
}

function isMultiStateGroup(value: string): value is MultiStateGroup {
  return (GROUPS as readonly string[]).includes(value)
}

function groupTag(group: MultiStateGroup): "проверять" | "изменять" | undefined {
  if (group === "xr:NotifyValue") return "проверять"
  if (group === "xr:ExtendValue") return "изменять"
  return undefined
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}
