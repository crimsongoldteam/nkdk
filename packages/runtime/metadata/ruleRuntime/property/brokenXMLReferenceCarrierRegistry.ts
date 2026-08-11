import type { TSchema } from "typebox"

import type { YamlPath } from "../../diagnostics/types"
import type { PropertyRule } from "./types"

export interface BrokenXMLReferenceImportResult {
  readonly yamlValue: unknown
  readonly taggedPaths: readonly YamlPath[]
}

export interface BrokenXMLReferenceExportResult {
  readonly yamlValue: unknown
  readonly transportedPaths: readonly YamlPath[]
}

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
    readonly isTagged: (path: YamlPath) => boolean
  }): BrokenXMLReferenceExportResult | undefined
  patchExportedXML(params: {
    readonly rule: PropertyRule
    readonly yamlValue: unknown
    readonly xmlValue: unknown
    readonly transportedPaths: readonly YamlPath[]
  }): unknown
  validationSchema(params: {
    readonly base: TSchema
    readonly validationGraph: boolean
  }): TSchema
  matchesTaggedYAML(params: {
    readonly rule: PropertyRule
    readonly yamlValue: unknown
    readonly path: YamlPath
    readonly isTagged: (path: YamlPath) => boolean
  }): boolean
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
    readonly isTagged: (path: YamlPath) => boolean
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
    readonly path: YamlPath
    readonly isTagged: (path: YamlPath) => boolean
  }): boolean
}

export function createBrokenXMLReferenceCarrierRegistry(
  registrations: readonly BrokenXMLReferenceCarrierRegistration[],
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
    return byPropertyType.get(rule.type) ?? []
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
        taggedPaths: [],
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
        ? { yamlValue: params.yamlValue, transportedPaths: [] }
        : { ...match.result, carrierName: match.registration.name }
    },
    patchExportedBrokenXMLReferences(params) {
      if (params.preparation.carrierName === undefined) return params.xmlValue
      const registration = byName.get(params.preparation.carrierName)
      if (registration === undefined) {
        throw new Error(`Не найден переносчик битой XML-ссылки: ${params.preparation.carrierName}`)
      }
      return registration.patchExportedXML({
        rule: params.rule,
        yamlValue: params.yamlValue,
        xmlValue: params.xmlValue,
        transportedPaths: params.preparation.transportedPaths,
      })
    },
    brokenXMLReferenceValidationSchema(params) {
      return carriers(params.rule).reduce(
        (schema, registration) => registration.validationSchema({
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
