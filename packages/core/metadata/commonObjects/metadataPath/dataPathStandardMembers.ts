import type { ConfigurationContext, FormDataPathAttributeContext, MetadataTargetOwnerContext } from "../../context/types"
import {
  getDataPathOwnerKindByItemType,
  standardMemberInternalToYamlForOwnerKind,
  standardMemberYamlToInternalForOwnerKind,
} from "../../validation/dataPath/registry"

const DATA_OBJECT_ROOTS = new Set(["Объект", "Запись", "Список"])

export function exportDataPathStandardMembersToYAML(context: ConfigurationContext, value: unknown): unknown {
  if (typeof value !== "string") return value

  return translateDirectObjectMember({
    context,
    value,
    translate: ({ ownerKind, segment }) => standardMemberInternalToYamlForOwnerKind(ownerKind, segment),
  })
}

export function importDataPathStandardMembersFromYAML(context: ConfigurationContext, value: unknown): unknown {
  if (typeof value !== "string") return value

  return translateDirectObjectMember({
    context,
    value,
    translate: ({ ownerKind, segment }) => standardMemberYamlToInternalForOwnerKind(ownerKind, segment),
  })
}

function translateDirectObjectMember(params: {
  context: ConfigurationContext
  value: string
  translate: (params: { ownerKind: string; segment: string }) => string | undefined
}): string {
  const ownerKind = currentDataPathOwnerKind(params.context)
  if (ownerKind === undefined) return params.value

  const { prefix, path } = splitDataPathPrefix(params.value)
  const segments = path.split(".")
  if (segments.length < 2 || !DATA_OBJECT_ROOTS.has(segments[0])) return params.value
  if (isDynamicListDataPathRoot(params.context, segments[0])) return params.value

  const translated = params.translate({ ownerKind, segment: segments[1] })
  if (translated === undefined) return params.value

  return `${prefix}${[segments[0], translated, ...segments.slice(2)].join(".")}`
}

function splitDataPathPrefix(value: string): { prefix: string; path: string } {
  if (value.startsWith("~")) return { prefix: "~", path: value.slice(1) }
  return { prefix: "", path: value }
}

function currentDataPathOwnerKind(context: ConfigurationContext): string | undefined {
  const frames = currentMetadataTargetOwners(context)
  for (let index = frames.length - 1; index >= 0; index--) {
    const registration = getDataPathOwnerKindByItemType(frames[index].itemType)
    if (registration !== undefined) return registration.kind
  }
  return undefined
}

function currentMetadataTargetOwners(context: ConfigurationContext): readonly MetadataTargetOwnerContext[] {
  return context.importFromYAML?.metadataTargetOwners ?? context.exportToYAML?.metadataTargetOwners ?? []
}

function isDynamicListDataPathRoot(context: ConfigurationContext, root: string): boolean {
  const attribute = currentFormAttributes(context).find((item) => item.name === root)
  return attribute !== undefined && isDynamicListAttribute(attribute)
}

function currentFormAttributes(context: ConfigurationContext): readonly FormDataPathAttributeContext[] {
  return context.importFromYAML?.formAttributes ?? context.exportToYAML?.formAttributes ?? []
}

function isDynamicListAttribute(attribute: FormDataPathAttributeContext): boolean {
  return attribute.type?.type?.includes("DynamicList") === true || attribute.dynamicList !== undefined
}
