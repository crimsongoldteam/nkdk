import { ImportPropertyValues } from "./propertyValues"

interface CandidateAddress {
  readonly itemType: string
  readonly itemYamlPath: readonly (string | number)[]
  readonly propertyKey: string
  readonly logicalAddress?: string
}

/** Логические адреса и типизированные пути имеют независимые пространства ключей. */
export class ImportCandidateValues<T extends object> {
  private readonly logical = new Map<string, T>()
  private readonly types = new Map<string, ImportPropertyValues<T>>()
  private count = 0

  get size(): number { return this.count }

  get(candidate: CandidateAddress): T | undefined {
    if (candidate.logicalAddress !== undefined) return this.logical.get(candidate.logicalAddress)
    return this.types.get(candidate.itemType)?.get(candidate.itemYamlPath, candidate.propertyKey)
  }

  set(candidate: CandidateAddress, value: T): void {
    if (candidate.logicalAddress !== undefined) {
      if (!this.logical.has(candidate.logicalAddress)) this.count++
      this.logical.set(candidate.logicalAddress, value)
      return
    }
    let values = this.types.get(candidate.itemType)
    if (values === undefined) {
      values = new ImportPropertyValues<T>()
      this.types.set(candidate.itemType, values)
    }
    const previousSize = values.size
    values.set(candidate.itemYamlPath, candidate.propertyKey, value)
    this.count += values.size - previousSize
  }

  *values(): IterableIterator<T> {
    yield* this.logical.values()
    for (const values of this.types.values()) yield* values.values()
  }
}
