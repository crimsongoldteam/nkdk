import type {
  FillValueObservation,
  NormalizedType,
  RawFillValue,
  RulesClassificationKind,
  RulesEvidence,
  UnresolvedXmlObservation,
  ValueCategory,
} from "./model"

export type SummaryStatus = "однозначно" | "варианты" | "противоречит rules" | "тип не определён"

export interface AggregatedFillValue {
  readonly attributeKind: "ordinary" | "standard"
  readonly standardIdentity?: { readonly ownerKind: string; readonly attributeName: string }
  readonly ownerKinds: readonly string[]
  readonly attributeNames: readonly string[]
  readonly itemKinds: readonly string[]
  readonly type: NormalizedType
  readonly valueCategory: ValueCategory
  readonly raw: RawFillValue
  readonly exactValue?: string
  readonly rulesClassification: RulesClassificationKind
  readonly rulesReason?: string
  readonly rulesEvidence?: RulesEvidence
  readonly occurrences: number
  readonly configurations: readonly string[]
  readonly examples: readonly string[]
}

export interface FillValueSummaryRow {
  readonly typeFamily: NormalizedType["family"]
  readonly typeSignature: string
  readonly typeSource: NormalizedType["source"]
  readonly attributeKind: "ordinary" | "standard"
  readonly standardIdentity?: { readonly ownerKind: string; readonly attributeName: string }
  readonly valueCategory: ValueCategory
  readonly fillValueForm: RawFillValue["form"]
  readonly occurrences: number
  readonly uniqueValues: number
  readonly configurations: number
  readonly status: SummaryStatus
  readonly exactValues: readonly string[]
  readonly examples: readonly string[]
}

export interface AggregatedUnresolvedXml {
  readonly element: string
  readonly reason: string
  readonly occurrences: number
  readonly configurations: readonly string[]
  readonly examples: readonly string[]
}

export interface CatalogReport {
  readonly formatVersion: 1
  readonly examplesLimit: number
  readonly counts: {
    readonly observations: number
    readonly exactValues: number
    readonly summaryRows: number
    readonly configurations: number
    readonly unresolved: number
  }
  readonly values: readonly AggregatedFillValue[]
  readonly summary: readonly FillValueSummaryRow[]
  readonly unresolved: readonly AggregatedUnresolvedXml[]
}

interface ExactAccumulator {
  readonly sample: FillValueObservation
  occurrences: number
  readonly ownerKinds: Set<string>
  readonly attributeNames: Set<string>
  readonly itemKinds: Set<string>
  readonly configurations: Set<string>
  readonly examples: Set<string>
}

interface UnresolvedAccumulator {
  readonly sample: UnresolvedXmlObservation
  occurrences: number
  readonly configurations: Set<string>
  readonly examples: Set<string>
}

export interface ObservationBatch {
  readonly observations: readonly FillValueObservation[]
  readonly unresolved: readonly UnresolvedXmlObservation[]
}

export interface ObservationAggregator {
  add(batch: ObservationBatch): void
  report(): CatalogReport
}

export function aggregateObservations(params: {
  readonly observations: readonly FillValueObservation[]
  readonly unresolved: readonly UnresolvedXmlObservation[]
  readonly examplesLimit: number
}): CatalogReport {
  const aggregator = createObservationAggregator({ examplesLimit: params.examplesLimit })
  aggregator.add(params)
  return aggregator.report()
}

export function createObservationAggregator(params: {
  readonly examplesLimit: number
}): ObservationAggregator {
  const exactAccumulators = new Map<string, ExactAccumulator>()
  const unresolvedAccumulators = new Map<string, UnresolvedAccumulator>()
  const configurations = new Set<string>()
  let observationCount = 0
  let unresolvedCount = 0

  return {
    add(batch): void {
      observationCount += batch.observations.length
      unresolvedCount += batch.unresolved.length
      for (const observation of batch.observations) {
        configurations.add(observation.configuration)
        addExactObservation(exactAccumulators, observation, params.examplesLimit)
      }
      for (const value of batch.unresolved) {
        configurations.add(value.configuration)
        addUnresolvedObservation(unresolvedAccumulators, value, params.examplesLimit)
      }
    },
    report(): CatalogReport {
      const exact = exactValues(exactAccumulators, params.examplesLimit)
      const summary = summarize(exact, params.examplesLimit)
      const unresolved = unresolvedValues(unresolvedAccumulators, params.examplesLimit)
      return {
        formatVersion: 1,
        examplesLimit: params.examplesLimit,
        counts: {
          observations: observationCount,
          exactValues: exact.length,
          summaryRows: summary.length,
          configurations: configurations.size,
          unresolved: unresolvedCount,
        },
        values: exact,
        summary,
        unresolved,
      }
    },
  }
}

function addExactObservation(
  accumulators: Map<string, ExactAccumulator>,
  observation: FillValueObservation,
  examplesLimit: number,
): void {
  const key = stableStringify([
    observation.attributeKind,
    observation.attributeKind === "standard"
      ? [observation.ownerKind, observation.attributeName]
      : null,
    observation.type,
    observation.valueCategory,
    observation.raw,
    observation.rulesClassification,
    observation.rulesReason ?? null,
    observation.rulesEvidence ?? null,
  ])
  let accumulator = accumulators.get(key)
  if (accumulator === undefined) {
    accumulator = {
      sample: observation,
      occurrences: 0,
      ownerKinds: new Set(),
      attributeNames: new Set(),
      itemKinds: new Set(),
      configurations: new Set(),
      examples: new Set(),
    }
    accumulators.set(key, accumulator)
  }
  accumulator.occurrences += 1
  accumulator.ownerKinds.add(observation.ownerKind)
  accumulator.attributeNames.add(observation.attributeName)
  accumulator.itemKinds.add(observation.itemKind)
  accumulator.configurations.add(observation.configuration)
  addBounded(accumulator.examples, `${observation.configuration}/${observation.file}`, examplesLimit)
}

function exactValues(
  accumulators: ReadonlyMap<string, ExactAccumulator>,
  examplesLimit: number,
): AggregatedFillValue[] {
  return [...accumulators.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, accumulator]) => {
      const sample = accumulator.sample
      return {
        attributeKind: sample.attributeKind,
        ...(sample.attributeKind === "standard"
          ? { standardIdentity: { ownerKind: sample.ownerKind, attributeName: sample.attributeName } }
          : {}),
        ownerKinds: sorted(accumulator.ownerKinds),
        attributeNames: sorted(accumulator.attributeNames),
        itemKinds: sorted(accumulator.itemKinds),
        type: sample.type,
        valueCategory: sample.valueCategory,
        raw: sample.raw,
        ...(sample.raw.text === undefined ? {} : { exactValue: sample.raw.text }),
        rulesClassification: sample.rulesClassification,
        ...(sample.rulesReason === undefined ? {} : { rulesReason: sample.rulesReason }),
        ...(sample.rulesEvidence === undefined ? {} : { rulesEvidence: sample.rulesEvidence }),
        occurrences: accumulator.occurrences,
        configurations: sorted(accumulator.configurations),
        examples: sorted(accumulator.examples).slice(0, examplesLimit),
      }
    })
}

interface SummaryAccumulator {
  readonly sample: AggregatedFillValue
  occurrences: number
  uniqueValues: number
  readonly configurations: Set<string>
  readonly exactValues: Set<string>
  readonly examples: Set<string>
}

function summarize(values: readonly AggregatedFillValue[], examplesLimit: number): FillValueSummaryRow[] {
  const groups = new Map<string, SummaryAccumulator>()
  const typeVariants = new Map<string, { variants: Set<string>; invalid: boolean; unresolved: boolean }>()

  for (const value of values) {
    const identity = value.standardIdentity ?? null
    const typeGroupKey = stableStringify([
      value.type.source,
      value.type.signature,
      value.attributeKind,
      identity,
    ])
    let typeGroup = typeVariants.get(typeGroupKey)
    if (typeGroup === undefined) {
      typeGroup = { variants: new Set(), invalid: false, unresolved: false }
      typeVariants.set(typeGroupKey, typeGroup)
    }
    typeGroup.variants.add(`${value.valueCategory}\u0000${value.raw.form}`)
    typeGroup.invalid ||= value.rulesClassification === "invalid"
    typeGroup.unresolved ||= value.type.family === "unresolved"

    const summaryKey = stableStringify([
      typeGroupKey,
      value.valueCategory,
      value.raw.form,
    ])
    let group = groups.get(summaryKey)
    if (group === undefined) {
      group = {
        sample: value,
        occurrences: 0,
        uniqueValues: 0,
        configurations: new Set(),
        exactValues: new Set(),
        examples: new Set(),
      }
      groups.set(summaryKey, group)
    }
    group.occurrences += value.occurrences
    group.uniqueValues += 1
    for (const configuration of value.configurations) group.configurations.add(configuration)
    if (value.exactValue !== undefined) addBounded(group.exactValues, value.exactValue, examplesLimit)
    for (const example of value.examples) addBounded(group.examples, example, examplesLimit)
  }

  return [...groups.values()]
    .map((group): FillValueSummaryRow => {
      const sample = group.sample
      const typeGroup = typeVariants.get(stableStringify([
        sample.type.source,
        sample.type.signature,
        sample.attributeKind,
        sample.standardIdentity ?? null,
      ]))
      if (typeGroup === undefined) throw new Error("Внутренняя ошибка группировки типа FillValue")
      return {
        typeFamily: sample.type.family,
        typeSignature: sample.type.signature,
        typeSource: sample.type.source,
        attributeKind: sample.attributeKind,
        ...(sample.standardIdentity === undefined ? {} : { standardIdentity: sample.standardIdentity }),
        valueCategory: sample.valueCategory,
        fillValueForm: sample.raw.form,
        occurrences: group.occurrences,
        uniqueValues: group.uniqueValues,
        configurations: group.configurations.size,
        status: summaryStatus(typeGroup),
        exactValues: sorted(group.exactValues).slice(0, examplesLimit),
        examples: sorted(group.examples).slice(0, examplesLimit),
      }
    })
    .sort(compareSummaryRows)
}

function summaryStatus(group: { variants: Set<string>; invalid: boolean; unresolved: boolean }): SummaryStatus {
  if (group.unresolved) return "тип не определён"
  if (group.invalid) return "противоречит rules"
  return group.variants.size > 1 ? "варианты" : "однозначно"
}

function addUnresolvedObservation(
  groups: Map<string, UnresolvedAccumulator>,
  value: UnresolvedXmlObservation,
  examplesLimit: number,
): void {
  const key = stableStringify([value.element, value.reason])
  let group = groups.get(key)
  if (group === undefined) {
    group = { sample: value, occurrences: 0, configurations: new Set(), examples: new Set() }
    groups.set(key, group)
  }
  group.occurrences += 1
  group.configurations.add(value.configuration)
  addBounded(group.examples, `${value.configuration}/${value.file}`, examplesLimit)
}

function unresolvedValues(
  groups: ReadonlyMap<string, UnresolvedAccumulator>,
  examplesLimit: number,
): AggregatedUnresolvedXml[] {
  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, group]) => ({
      element: group.sample.element,
      reason: group.sample.reason,
      occurrences: group.occurrences,
      configurations: sorted(group.configurations),
      examples: sorted(group.examples).slice(0, examplesLimit),
    }))
}

const familyOrder: readonly NormalizedType["family"][] = [
  "string",
  "number",
  "boolean",
  "dateTime",
  "reference",
  "composite",
  "unresolved",
]

function compareSummaryRows(left: FillValueSummaryRow, right: FillValueSummaryRow): number {
  return familyOrder.indexOf(left.typeFamily) - familyOrder.indexOf(right.typeFamily) ||
    left.typeSignature.localeCompare(right.typeSignature) ||
    left.attributeKind.localeCompare(right.attributeKind) ||
    stableStringify(left.standardIdentity ?? null).localeCompare(stableStringify(right.standardIdentity ?? null)) ||
    left.valueCategory.localeCompare(right.valueCategory) ||
    left.fillValueForm.localeCompare(right.fillValueForm)
}

function sorted(values: Iterable<string>): string[] {
  return [...values].sort((left, right) => left.localeCompare(right))
}

function addBounded(values: Set<string>, value: string, limit: number): void {
  values.add(value)
  if (values.size <= limit) return
  let greatest: string | undefined
  for (const candidate of values) {
    if (greatest === undefined || candidate.localeCompare(greatest) > 0) greatest = candidate
  }
  if (greatest !== undefined) values.delete(greatest)
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableJson(value))
}

function stableJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableJson)
  if (typeof value !== "object" || value === null) return value
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, stableJson(nested)]),
  )
}
