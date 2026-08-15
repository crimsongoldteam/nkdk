import type { TSchema } from "typebox"

import type { YamlPath } from "../../diagnostics/types"
import type { PropertyRule } from "./types"
import { yamlScalarTagAt } from "../../../yaml/scalarTags"
import { yamlMappingKeyTagAt } from "../../../yaml/mappingKeyTags"

export interface BrokenXMLReferenceImportResult {
  readonly yamlValue: unknown
  readonly taggedLocations: readonly BrokenXMLReferenceLocation[]
}

export interface BrokenXMLReferenceExportResult {
  readonly yamlValue: unknown
  readonly transportedLocations: readonly BrokenXMLReferenceLocation[]
}

export type BrokenXMLReferenceLocation =
  | { readonly kind: "value"; readonly path: YamlPath }
  | { readonly kind: "key"; readonly path: YamlPath; readonly key: string }

export interface PreparedBrokenXMLReferenceExport
  extends BrokenXMLReferenceExportResult {
  readonly carrierName?: string
}

export interface BrokenXMLReferenceCarrierRegistration {
  readonly name: string
  readonly propertyType: string
  tryImport(params: {
    readonly rule: PropertyRule
    readonly xmlValue: unknown
    readonly yamlValue: unknown
  }): BrokenXMLReferenceImportResult | undefined
  prepareExport(params: {
    readonly rule: PropertyRule
    readonly yamlValue: unknown
    readonly isTagged: (location: BrokenXMLReferenceLocation) => boolean
  }): BrokenXMLReferenceExportResult | undefined
  patchExportedXML(params: {
    readonly rule: PropertyRule
    readonly yamlValue: unknown
    readonly xmlValue: unknown
    readonly transportedLocations: readonly BrokenXMLReferenceLocation[]
  }): unknown
  validationSchema(params: {
    readonly rule: PropertyRule
    readonly base: TSchema
    readonly validationGraph: boolean
  }): TSchema
  matchesTaggedYAML(params: {
    readonly rule: PropertyRule
    readonly yamlValue: unknown
    readonly location: BrokenXMLReferenceLocation
    readonly isTagged: (location: BrokenXMLReferenceLocation) => boolean
  }): boolean
}

export type BrokenXMLReferenceTypeCarrier = Omit<BrokenXMLReferenceCarrierRegistration, "propertyType">

export function isRelativeYAMLReferenceTagged(
  parent: Readonly<Record<string, unknown>>,
  propertyKey: string,
  location: BrokenXMLReferenceLocation,
): boolean {
  const path = location.path
  if (location.kind === "key") {
    let mapping: unknown = parent[propertyKey]
    for (const segment of path) {
      if (typeof mapping !== "object" || mapping === null) return false
      mapping = (mapping as Readonly<Record<string | number, unknown>>)[segment]
    }
    return yamlMappingKeyTagAt(mapping, location.key) === "xml/reference"
  }
  if (path.length === 0) return yamlScalarTagAt(parent, propertyKey) === "xml/reference"
  let current: unknown = parent[propertyKey]
  for (const segment of path.slice(0, -1)) {
    if (typeof current !== "object" || current === null) return false
    current = (current as Readonly<Record<string | number, unknown>>)[segment]
  }
  const key = path[path.length - 1]
  return key !== undefined && yamlScalarTagAt(current, key) === "xml/reference"
}

export interface BrokenXMLReferenceCarrierRegistry {
  normalizeImportedBrokenXMLReferences(params: {
    readonly rule: PropertyRule
    readonly xmlValue: unknown
    readonly yamlValue: unknown
  }): BrokenXMLReferenceImportResult
  prepareBrokenXMLReferenceExport(params: {
    readonly rule: PropertyRule
    readonly yamlValue: unknown
    readonly isTagged: (location: BrokenXMLReferenceLocation) => boolean
  }): PreparedBrokenXMLReferenceExport
  patchExportedBrokenXMLReferences(params: {
    readonly rule: PropertyRule
    readonly yamlValue: unknown
    readonly xmlValue: unknown
    readonly preparation: PreparedBrokenXMLReferenceExport
  }): unknown
  brokenXMLReferenceValidationSchema(params: {
    readonly rule: PropertyRule
    readonly base: TSchema
    readonly validationGraph: boolean
  }): TSchema
  isTransportedBrokenXMLReference(params: {
    readonly rule: PropertyRule
    readonly yamlValue: unknown
    readonly location: BrokenXMLReferenceLocation
    readonly isTagged: (location: BrokenXMLReferenceLocation) => boolean
  }): boolean
}

export function createBrokenXMLReferenceCarrierRegistry(
  registrations: readonly BrokenXMLReferenceCarrierRegistration[],
  typeCarrier: (propertyType: string) => BrokenXMLReferenceTypeCarrier | undefined = () => undefined,
): BrokenXMLReferenceCarrierRegistry {
  const byPropertyType = new Map<string, BrokenXMLReferenceCarrierRegistration[]>()
  const byName = new Map<string, BrokenXMLReferenceCarrierRegistration>()
  for (const registration of registrations) {
    if (byName.has(registration.name)) {
      throw new Error(`Переносчик битой XML-ссылки уже зарегистрирован: ${registration.name}`)
    }
    byName.set(registration.name, registration)
    const current = byPropertyType.get(registration.propertyType) ?? []
    byPropertyType.set(registration.propertyType, [...current, registration])
  }

  function carriers(rule: PropertyRule): readonly BrokenXMLReferenceCarrierRegistration[] {
    const common = typeCarrier(rule.type)
    return [
      ...(common === undefined ? [] : [{ ...common, propertyType: rule.type }]),
      ...(byPropertyType.get(rule.type) ?? []),
    ]
  }

  return {
    normalizeImportedBrokenXMLReferences(params) {
      const matches = carriers(params.rule).flatMap((registration) => {
        const result = registration.tryImport(params)
        return result === undefined ? [] : [{ registration, result }]
      })
      assertSingleMatch(matches.map(({ registration }) => registration))
      return matches[0]?.result ?? {
        yamlValue: params.yamlValue,
        taggedLocations: [],
      }
    },
    prepareBrokenXMLReferenceExport(params) {
      const matches = carriers(params.rule).flatMap((registration) => {
        const result = registration.prepareExport(params)
        return result === undefined ? [] : [{ registration, result }]
      })
      assertSingleMatch(matches.map(({ registration }) => registration))
      const match = matches[0]
      return match === undefined
        ? { yamlValue: params.yamlValue, transportedLocations: [] }
        : { ...match.result, carrierName: match.registration.name }
    },
    patchExportedBrokenXMLReferences(params) {
      if (params.preparation.carrierName === undefined) return params.xmlValue
      const registration = carriers(params.rule).find(({ name }) => name === params.preparation.carrierName)
      if (registration === undefined) {
        throw new Error(`Не найден переносчик битой XML-ссылки: ${params.preparation.carrierName}`)
      }
      return registration.patchExportedXML({
        rule: params.rule,
        yamlValue: params.yamlValue,
        xmlValue: params.xmlValue,
        transportedLocations: params.preparation.transportedLocations,
      })
    },
    brokenXMLReferenceValidationSchema(params) {
      return carriers(params.rule).reduce(
        (schema, registration) => registration.validationSchema({
          rule: params.rule,
          base: schema,
          validationGraph: params.validationGraph,
        }),
        params.base,
      )
    },
    isTransportedBrokenXMLReference(params) {
      const matches = carriers(params.rule).filter((registration) =>
        registration.matchesTaggedYAML(params))
      assertSingleMatch(matches)
      return matches.length === 1
    },
  }
}

function assertSingleMatch(
  matches: readonly BrokenXMLReferenceCarrierRegistration[],
): void {
  if (matches.length < 2) return
  throw new Error(
    `Конфликт переносчиков битой XML-ссылки: ${matches.map(({ name }) => name).join(", ")}`,
  )
}
