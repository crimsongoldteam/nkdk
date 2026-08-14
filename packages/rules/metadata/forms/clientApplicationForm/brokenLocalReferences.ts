import { Type, type TSchema } from "typebox"

import { xmlScalarTagPayload, xmlScalarTagValue } from "@nkdk/runtime"
import {
  defineMetadataRules,
  emptyMetadataRules,
  type BrokenXMLReferenceCarrierRegistration,
  type PropertyRule,
} from "@nkdk/runtime/rule-kit"

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
const SEGMENTED_REFERENCE = `\\d+/\\d+:${UUID}(?:/\\d+:${UUID})*`

export const LOCAL_FORM_REFERENCE_PATTERNS = {
  Command: new RegExp(`^(?:\\d+|\\d+:${UUID})$`, "i"),
  CommandName: new RegExp(`^\\d+:${UUID}$`, "i"),
  Field: new RegExp(`^${SEGMENTED_REFERENCE}$`, "i"),
  DataPath: new RegExp(`^${SEGMENTED_REFERENCE}$`, "i"),
  "xr:DataPath": new RegExp(`^\\d+:${UUID}/\\d+$`, "i"),
  CommandGroup: new RegExp(`^${UUID}$`, "i"),
  GroupList: new RegExp(`^\\d+:${UUID}$`, "i"),
  UserSettingsGroup: new RegExp(`^\\d+:${UUID}$`, "i"),
} as const

type LocalFormReferenceElement = keyof typeof LOCAL_FORM_REFERENCE_PATTERNS

export function isBrokenLocalFormReference(
  element: LocalFormReferenceElement,
  value: string,
): boolean {
  return LOCAL_FORM_REFERENCE_PATTERNS[element].test(value)
}

const commandNameCarrier = scalarCarrier({
  name: "commandName",
  propertyType: "CommandName",
  element: "CommandName",
})
const dataPathCarrier = scalarCarrier({
  name: "dataPath",
  propertyType: "DataPath",
  element: "DataPath",
})

const formStringCarrier: BrokenXMLReferenceCarrierRegistration = {
  ...scalarCarrier({
    name: "formString",
    propertyType: "string",
    element: "GroupList",
  }),
  tryImport(params) {
    const element = formStringElement(params.rule)
    return element === undefined
      ? undefined
      : importScalar(element, params.xmlValue, params.yamlValue)
  },
  prepareExport(params) {
    const element = formStringElement(params.rule)
    return element === undefined
      ? undefined
      : prepareScalar(element, params.yamlValue, params.isTagged)
  },
  patchExportedXML({ rule, yamlValue, xmlValue }) {
    const element = formStringElement(rule)
    return element === undefined ? xmlValue : scalarPayload(element, yamlValue)
  },
  validationSchema({ base, validationGraph, rule }) {
    const element = formStringElement(rule)
    return !validationGraph || element === undefined
      ? base
      : Type.Union([base, taggedSchema(element)])
  },
  matchesTaggedYAML({ rule, yamlValue, path, isTagged }) {
    const element = formStringElement(rule)
    return element !== undefined && matchesScalar(element, yamlValue, path, isTagged)
  },
}

const fieldsListCarrier = collectionCarrier({
  name: "fieldsList",
  propertyType: "FieldsList",
  element: "Field",
  xmlItems(_rule, xmlValue) {
    if (!isRecord(xmlValue)) return undefined
    const value = xmlValue.Field ?? xmlValue["xr:Field"]
    return value === undefined ? undefined : asArray(value)
  },
  patch(rule, xmlValue, values) {
    const item = "fieldsListXMLItem" in rule && rule.fieldsListXMLItem === "xr:Field"
      ? "xr:Field"
      : "Field"
    return isRecord(xmlValue) ? { ...xmlValue, [item]: values } : xmlValue
  },
})

const commandInterfaceCarrier = nestedCarrier({
  name: "commandInterface",
  propertyType: "CommandInterface",
  locations: [
    ...commandInterfaceLocations("NavigationPanel", "ПанельНавигации"),
    ...commandInterfaceLocations("CommandBar", "КоманднаяПанель"),
  ],
})

const choiceParameterLinksCarrier = nestedCarrier({
  name: "choiceParameterLinks",
  propertyType: "ChoiceParameterLinks",
  locations: [{
    element: "xr:DataPath",
    xmlCollection: ["xr:Link"],
    xmlProperty: "xr:DataPath",
    yamlCollection: [],
    yamlProperty: "ПутьКДанным",
  }],
})

const typeLinkCarrier = scalarCarrier({
  name: "typeLink",
  propertyType: "TypeLink",
  element: "xr:DataPath",
  xmlText(value) {
    if (!isRecord(value)) return undefined
    return scalarXMLText(value["xr:DataPath"])
  },
  patchXML(value, payload) {
    return isRecord(value) ? { ...value, "xr:DataPath": payload } : value
  },
})

export const brokenLocalFormReferenceRules = defineMetadataRules({
  ...emptyMetadataRules,
  brokenXMLReferenceCarriers: [
    commandNameCarrier,
    dataPathCarrier,
    formStringCarrier,
    fieldsListCarrier,
    commandInterfaceCarrier,
    choiceParameterLinksCarrier,
    typeLinkCarrier,
  ],
})

function scalarCarrier(params: {
  name: string
  propertyType: string
  element: LocalFormReferenceElement
  xmlText?: (value: unknown) => string | undefined
  patchXML?: (value: unknown, payload: string) => unknown
}): BrokenXMLReferenceCarrierRegistration {
  return {
    name: `clientApplicationForm.localReference.${params.name}`,
    propertyType: params.propertyType,
    tryImport({ xmlValue, yamlValue }) {
      const text = params.xmlText?.(xmlValue) ?? scalarXMLText(xmlValue)
      return importScalar(params.element, text, yamlValue)
    },
    prepareExport({ yamlValue, isTagged }) {
      return prepareScalar(params.element, yamlValue, isTagged)
    },
    patchExportedXML({ yamlValue, xmlValue }) {
      const payload = scalarPayload(params.element, yamlValue)
      return params.patchXML?.(xmlValue, payload) ?? payload
    },
    validationSchema({ base, validationGraph }) {
      return validationGraph ? Type.Union([base, taggedSchema(params.element)]) : base
    },
    matchesTaggedYAML({ yamlValue, path, isTagged }) {
      return matchesScalar(params.element, yamlValue, path, isTagged)
    },
  }
}

function importScalar(
  element: LocalFormReferenceElement,
  xmlValue: unknown,
  yamlValue: unknown,
) {
  const text = scalarXMLText(xmlValue)
  return text !== undefined && yamlValue === text && isBrokenLocalFormReference(element, text)
    ? { yamlValue: xmlScalarTagValue(text), taggedPaths: [[]] }
    : undefined
}

function prepareScalar(
  element: LocalFormReferenceElement,
  yamlValue: unknown,
  isTagged: (path: readonly (string | number)[]) => boolean,
) {
  return isTagged([]) && validTaggedPayload(element, yamlValue)
    ? { yamlValue: scalarPayload(element, yamlValue), transportedPaths: [[]] }
    : undefined
}

function matchesScalar(
  element: LocalFormReferenceElement,
  yamlValue: unknown,
  path: readonly (string | number)[],
  isTagged: (path: readonly (string | number)[]) => boolean,
): boolean {
  return path.length === 0 && isTagged(path) && validTaggedPayload(element, yamlValue)
}

function scalarPayload(element: LocalFormReferenceElement, value: unknown): string {
  if (!validTaggedPayload(element, value)) {
    throw new Error(`Битая локальная ссылка ${element} не соответствует зарегистрированной грамматике`)
  }
  return xmlScalarTagPayload(value)
}

function validTaggedPayload(element: LocalFormReferenceElement, value: unknown): value is string {
  return typeof value === "string" &&
    isBrokenLocalFormReference(element, xmlScalarTagPayload(value))
}

function taggedSchema(element: LocalFormReferenceElement): TSchema {
  return Type.String({ pattern: `^!xml (?:${LOCAL_FORM_REFERENCE_PATTERNS[element].source.slice(1, -1)})$` })
}

function formStringElement(rule: PropertyRule): "GroupList" | "UserSettingsGroup" | undefined {
  return rule.xml === "GroupList" || rule.xml === "UserSettingsGroup"
    ? rule.xml
    : undefined
}

interface CollectionCarrierParams {
  name: string
  propertyType: string
  element: LocalFormReferenceElement
  xmlItems(rule: PropertyRule, xmlValue: unknown): readonly unknown[] | undefined
  patch(rule: PropertyRule, xmlValue: unknown, values: readonly unknown[]): unknown
}

function collectionCarrier(params: CollectionCarrierParams): BrokenXMLReferenceCarrierRegistration {
  return {
    name: `clientApplicationForm.localReference.${params.name}`,
    propertyType: params.propertyType,
    tryImport({ rule, xmlValue, yamlValue }) {
      if (!Array.isArray(yamlValue)) return undefined
      const xmlItems = params.xmlItems(rule, xmlValue)
      if (xmlItems === undefined) return undefined
      const matches = xmlItems.flatMap((value, index) => {
        const text = scalarXMLText(value)
        return text !== undefined && isBrokenLocalFormReference(params.element, text)
          ? [{ index, text }]
          : []
      })
      if (matches.length === 0) return undefined
      const normalized = [...yamlValue]
      for (const { index, text } of matches) normalized[index] = xmlScalarTagValue(text)
      return { yamlValue: normalized, taggedPaths: matches.map(({ index }) => [index]) }
    },
    prepareExport({ yamlValue, isTagged }) {
      if (!Array.isArray(yamlValue)) return undefined
      const paths: number[][] = []
      const prepared = yamlValue.map((value, index) => {
        if (!isTagged([index])) return value
        paths.push([index])
        return scalarPayload(params.element, value)
      })
      return paths.length === 0 ? undefined : { yamlValue: prepared, transportedPaths: paths }
    },
    patchExportedXML({ rule, yamlValue, xmlValue, transportedPaths }) {
      if (!Array.isArray(yamlValue)) return xmlValue
      const current = params.xmlItems(rule, xmlValue)
      if (current === undefined) return xmlValue
      const values = [...current]
      for (const [index] of transportedPaths) {
        if (typeof index === "number") values[index] = scalarPayload(params.element, yamlValue[index])
      }
      return params.patch(rule, xmlValue, values)
    },
    validationSchema({ base, validationGraph }) {
      return validationGraph && "items" in base
        ? { ...base, items: Type.Union([base.items as TSchema, taggedSchema(params.element)]) }
        : base
    },
    matchesTaggedYAML({ yamlValue, path, isTagged }) {
      const index = path[0]
      return Array.isArray(yamlValue) && path.length === 1 && typeof index === "number" &&
        isTagged(path) && validTaggedPayload(params.element, yamlValue[index])
    },
  }
}

interface NestedLocation {
  element: LocalFormReferenceElement
  xmlCollection: readonly string[]
  xmlProperty: string
  yamlCollection: readonly string[]
  yamlProperty: string
}

function nestedCarrier(params: {
  name: string
  propertyType: string
  locations: readonly NestedLocation[]
}): BrokenXMLReferenceCarrierRegistration {
  return {
    name: `clientApplicationForm.localReference.${params.name}`,
    propertyType: params.propertyType,
    tryImport({ xmlValue, yamlValue }) {
      const normalized = cloneValue(yamlValue)
      const paths: (string | number)[][] = []
      for (const location of params.locations) {
        const xmlItems = nestedCollection(xmlValue, location.xmlCollection)
        const yamlItems = nestedCollection(normalized, location.yamlCollection)
        if (xmlItems === undefined || yamlItems === undefined) continue
        for (let index = 0; index < xmlItems.length; index++) {
          const text = scalarXMLText(recordValue(xmlItems[index], location.xmlProperty))
          if (text === undefined || !isBrokenLocalFormReference(location.element, text)) continue
          const yamlItem = yamlItems[index]
          if (!isRecord(yamlItem)) continue
          ;(yamlItem as Record<string, unknown>)[location.yamlProperty] = xmlScalarTagValue(text)
          paths.push([...location.yamlCollection, index, location.yamlProperty])
        }
      }
      return paths.length === 0 ? undefined : { yamlValue: normalized, taggedPaths: paths }
    },
    prepareExport({ yamlValue, isTagged }) {
      const prepared = cloneValue(yamlValue)
      const paths: (string | number)[][] = []
      for (const location of params.locations) {
        const items = nestedCollection(prepared, location.yamlCollection)
        if (items === undefined) continue
        for (let index = 0; index < items.length; index++) {
          const path = [...location.yamlCollection, index, location.yamlProperty]
          if (!isTagged(path)) continue
          const item = items[index]
          if (!isRecord(item)) continue
          ;(item as Record<string, unknown>)[location.yamlProperty] = scalarPayload(
            location.element,
            item[location.yamlProperty],
          )
          paths.push(path)
        }
      }
      return paths.length === 0 ? undefined : { yamlValue: prepared, transportedPaths: paths }
    },
    patchExportedXML({ yamlValue, xmlValue, transportedPaths }) {
      const patched = cloneValue(xmlValue)
      for (const location of params.locations) {
        const xmlItems = nestedCollection(patched, location.xmlCollection)
        const yamlItems = nestedCollection(yamlValue, location.yamlCollection)
        if (xmlItems === undefined || yamlItems === undefined) continue
        for (let index = 0; index < yamlItems.length; index++) {
          const path = [...location.yamlCollection, index, location.yamlProperty]
          if (!hasPath(transportedPaths, path)) continue
          const xmlItem = xmlItems[index]
          const yamlItem = yamlItems[index]
          if (!isRecord(xmlItem) || !isRecord(yamlItem)) continue
          ;(xmlItem as Record<string, unknown>)[location.xmlProperty] = scalarPayload(
            location.element,
            yamlItem[location.yamlProperty],
          )
        }
      }
      return patched
    },
    validationSchema({ base }) {
      return base
    },
    matchesTaggedYAML({ yamlValue, path, isTagged }) {
      if (!isTagged(path)) return false
      return params.locations.some((location) => {
        if (path.length !== location.yamlCollection.length + 2) return false
        if (!location.yamlCollection.every((part, index) => path[index] === part)) return false
        if (path[path.length - 1] !== location.yamlProperty) return false
        const value = valueAtPath(yamlValue, path)
        return validTaggedPayload(location.element, value)
      })
    },
  }
}

function commandInterfaceLocations(
  xmlSection: string,
  yamlSection: string,
): NestedLocation[] {
  return [
    { element: "Command", xmlCollection: [xmlSection, "Item"], xmlProperty: "Command", yamlCollection: [yamlSection], yamlProperty: "Команда" },
    { element: "CommandGroup", xmlCollection: [xmlSection, "Item"], xmlProperty: "CommandGroup", yamlCollection: [yamlSection], yamlProperty: "ГруппаКоманд" },
  ]
}

function nestedCollection(value: unknown, path: readonly string[]): unknown[] | undefined {
  const nested = valueAtPath(value, path)
  if (nested === undefined) return undefined
  return Array.isArray(nested) ? nested : [nested]
}

function valueAtPath(value: unknown, path: readonly (string | number)[]): unknown {
  let current = value
  for (const segment of path) {
    if (!isRecord(current) && !Array.isArray(current)) return undefined
    current = (current as Readonly<Record<string | number, unknown>>)[segment]
  }
  return current
}

function hasPath(paths: readonly (readonly (string | number)[])[], expected: readonly (string | number)[]): boolean {
  return paths.some((path) => path.length === expected.length && path.every((part, index) => part === expected[index]))
}

function recordValue(value: unknown, key: string): unknown {
  return isRecord(value) ? value[key] : undefined
}

function scalarXMLText(value: unknown): string | undefined {
  if (typeof value === "string") return value
  return isRecord(value) && typeof value["#text"] === "string" ? value["#text"] : undefined
}

function asArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [value]
}

function cloneValue<T>(value: T): T {
  return structuredClone(value)
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
