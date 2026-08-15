import {
  definePropertyTypeRule,
  renameMetadataTargetMappingKey,
  type BrokenXMLReferenceLocation,
  type BrokenXMLReferenceTypeCarrier,
} from "@nkdk/runtime/rule-kit"
import { isMDObjectRefUuid } from "../metadataRef/brokenMDObjectRef"
import { UserVisibleBrokenReferenceJSONSchema } from "./types"
import { markYAMLMappingKeyTag } from "@nkdk/runtime"
import { Type } from "typebox"

export const brokenUserVisibleReferenceCarrier: BrokenXMLReferenceTypeCarrier = {
  name: "userVisible.roleUuid",
  tryImport({ rule, xmlValue, yamlValue }) {
    const roles = yamlRoles(yamlValue, rule.yaml)
    if (roles === undefined || !isRecord(xmlValue)) return undefined
    const rawValues = xmlValue["xr:Value"]
    if (rawValues === undefined) return undefined
    const values = Array.isArray(rawValues) ? rawValues : [rawValues]
    const taggedLocations = values.flatMap((item): BrokenXMLReferenceLocation[] => {
      if (!isRecord(item) || typeof item._name !== "string" || !isMDObjectRefUuid(item._name)) return []
      if (!Object.prototype.hasOwnProperty.call(roles, item._name)) return []
      markYAMLMappingKeyTag(roles, item._name, "xml/reference")
      return [{ kind: "key", path: ["Роли"], key: item._name }]
    })
    return taggedLocations.length === 0 ? undefined : { yamlValue, taggedLocations }
  },
  prepareExport({ yamlValue, isTagged }) {
    const roles = yamlRoles(yamlValue)
    if (roles === undefined) return undefined
    const prepared = cloneRecordWithRoles(yamlValue, roles)
    const preparedRoles = yamlRoles(prepared)!
    const transportedLocations: BrokenXMLReferenceLocation[] = []
    for (const [index, key] of Object.keys(roles).entries()) {
      const location = { kind: "key", path: ["Роли"], key } as const
      if (!isTagged(location)) continue
      if (!isMDObjectRefUuid(key)) {
        throw new Error("Битая ссылка роли должна содержать канонический UUID")
      }
      renameMetadataTargetMappingKey(preparedRoles, key, temporaryRoleName(index, preparedRoles))
      transportedLocations.push(location)
    }
    return transportedLocations.length === 0
      ? undefined
      : { yamlValue: prepared, transportedLocations }
  },
  patchExportedXML({ yamlValue, xmlValue, transportedLocations }) {
    const roles = yamlRoles(yamlValue)
    if (roles === undefined || !isRecord(xmlValue)) return xmlValue
    const rawValues = xmlValue["xr:Value"]
    const values = (Array.isArray(rawValues) ? rawValues : [rawValues]).map((item) =>
      isRecord(item) ? { ...item } : item)
    const keys = Object.keys(roles)
    for (const location of transportedLocations) {
      if (location.kind !== "key") continue
      const index = keys.indexOf(location.key)
      if (index < 0) continue
      const item = values.find((candidate) =>
        isRecord(candidate) && candidate._name === `Role.${temporaryRoleName(index, roles)}`)
      if (isMutableRecord(item)) item._name = location.key
    }
    return { ...xmlValue, "xr:Value": Array.isArray(rawValues) ? values : values[0] }
  },
  validationSchema({ base, validationGraph }) {
    return validationGraph ? Type.Union([base, UserVisibleBrokenReferenceJSONSchema]) : base
  },
  matchesTaggedYAML({ yamlValue, location, isTagged }) {
    const roles = yamlRoles(yamlValue)
    return location.kind === "key"
      && roles !== undefined
      && location.path.length === 1
      && location.path[0] === "Роли"
      && isTagged(location)
      && isMDObjectRefUuid(location.key)
  },
}

export const metadataPropertyRule000 = definePropertyTypeRule(
  "UserVisible",
  "brokenXMLReferenceCarrier",
  brokenUserVisibleReferenceCarrier,
)

function yamlRoles(value: unknown, yamlKey?: string): Record<string, unknown> | undefined {
  if (!isRecord(value)) return undefined
  const visible = isRecord(value.Роли)
    ? value
    : typeof yamlKey === "string" && isRecord(value[yamlKey])
      ? value[yamlKey]
      : undefined
  return isRecord(visible) && isMutableRecord(visible.Роли) ? visible.Роли : undefined
}

function cloneRecordWithRoles(value: unknown, roles: Record<string, unknown>): Record<string, unknown> {
  if (!isRecord(value)) return {}
  if (isRecord(value.Роли)) return { ...value, Роли: { ...roles } }
  const key = Object.keys(value).find((candidate) => isRecord(value[candidate]) && value[candidate]!.Роли === roles)
  return key === undefined ? { ...value } : { ...value, [key]: { ...(value[key] as object), Роли: { ...roles } } }
}

function temporaryRoleName(index: number, roles?: Readonly<Record<string, unknown>>): string {
  const base = `__nkdk_broken_role_${index}`
  if (roles === undefined || !Object.prototype.hasOwnProperty.call(roles, base)) return base
  let suffix = 1
  while (Object.prototype.hasOwnProperty.call(roles, `${base}_${suffix}`)) suffix += 1
  return `${base}_${suffix}`
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isMutableRecord(value: unknown): value is Record<string, unknown> {
  return isRecord(value)
}
