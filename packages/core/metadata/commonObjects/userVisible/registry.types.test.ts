import { describe, expect, it } from "vitest"
import type { PropertyToMetadata, PropertyToYAML } from "@nkdk/runtime/rule-kit"
import type { UserVisible, UserVisibleYAML } from "./types"

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
type Assert<T extends true> = T

export type UserVisibleMetadataTypeCheck = Assert<Equal<PropertyToMetadata<"UserVisible">, UserVisible>>
export type UserVisibleYAMLTypeCheck = Assert<Equal<PropertyToYAML<"UserVisible">, UserVisibleYAML>>

describe("user visible registry types", () => {
  it("keeps the compile-time contract", () => {
    expect(true).toBe(true)
  })
})
