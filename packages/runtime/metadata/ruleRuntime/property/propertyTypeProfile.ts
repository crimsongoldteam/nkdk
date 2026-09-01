import { performance } from "node:perf_hooks"

export interface PropertyTypeProfile {
  propertyCount: number
  inclusiveMs: number
  exclusiveMs: number
}

export interface PropertyTypeProfileOwner {
  readonly propertyTypeProfiling: boolean
  propertyTypeProfiles: Record<string, PropertyTypeProfile>
}

export interface PropertyTypeProfileFrame {
  readonly propertyType: string
  readonly startedAt: number
  childMs: number
}

const stacks = new WeakMap<PropertyTypeProfileOwner, PropertyTypeProfileFrame[]>()

export function beginPropertyTypeProfile(
  profile: PropertyTypeProfileOwner | undefined,
  propertyType: string,
): PropertyTypeProfileFrame | undefined {
  if (profile?.propertyTypeProfiling !== true) return undefined
  const frame = { propertyType, startedAt: performance.now(), childMs: 0 }
  const stack = stacks.get(profile) ?? []
  stack.push(frame)
  stacks.set(profile, stack)
  return frame
}

export function finishPropertyTypeProfile(
  profile: PropertyTypeProfileOwner | undefined,
  frame: PropertyTypeProfileFrame | undefined,
  direction: "XML → YAML" | "YAML → XML",
): void {
  if (profile === undefined || frame === undefined) return
  const stack = stacks.get(profile)
  if (stack?.at(-1) !== frame) throw new Error(`Нарушен стек профиля ${direction}`)
  stack.pop()
  if (stack.length === 0) stacks.delete(profile)
  const elapsedMs = performance.now() - frame.startedAt
  const current = profile.propertyTypeProfiles[frame.propertyType] ?? {
    propertyCount: 0,
    inclusiveMs: 0,
    exclusiveMs: 0,
  }
  current.propertyCount += 1
  current.inclusiveMs += elapsedMs
  current.exclusiveMs += Math.max(0, elapsedMs - frame.childMs)
  profile.propertyTypeProfiles[frame.propertyType] = current
  const parent = stack.at(-1)
  if (parent !== undefined) parent.childMs += elapsedMs
}
