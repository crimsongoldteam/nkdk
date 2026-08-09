import { describe, expect, it } from "vitest"
import type { YAMLTypeByRule } from "../ruleRuntime/metadataItem/yaml"
import {
  getRegisteredSystemEnumerationNames,
  getSystemEnumeration,
} from "../ruleRuntime/property/systemEnumerationRegistry"
import type {
  SystemEnumerationToMetadata,
  SystemEnumerationToYAML,
} from "../ruleRuntime/property/systemEnumerationRegistry"
import "./index"
import * as systemEnumerationExports from "./types"
import type { PictureLib, PictureLibYAML } from "./types"

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
type Assert<T extends true> = T

const ruleWithPictureLib = {
  itemType: "TypeRegistryTest",
  properties: {
    picture: {
      type: "SystemEnumeration",
      typeSE: "PictureLib",
      yaml: "БиблиотекаКартинок",
    },
  },
} as const

export type SystemEnumerationMetadataTypeCheck = Assert<
  Equal<SystemEnumerationToMetadata<"PictureLib">, PictureLib>
>
export type SystemEnumerationYAMLTypeCheck = Assert<Equal<SystemEnumerationToYAML<"PictureLib">, PictureLibYAML>>
export type RuleYAMLTypeCheck = Assert<
  Equal<YAMLTypeByRule<typeof ruleWithPictureLib>["БиблиотекаКартинок"], PictureLibYAML | undefined>
>

describe("system enumeration registry types", () => {
  it("keeps compile-time model and YAML maps available", () => {
    expect(ruleWithPictureLib.properties.picture.typeSE).toBe("PictureLib")
  })

  it("registers every exported FromYAML and ToYAML table pair", () => {
    const expectedNames = Object.keys(systemEnumerationExports)
      .filter((name) => name.endsWith("FromYAML"))
      .map((name) => name.slice(0, -"FromYAML".length))

    expect(expectedNames.length).toBeGreaterThan(0)
    for (const name of expectedNames) {
      expect(getSystemEnumeration(name), name).toBeDefined()
    }
    expect(getRegisteredSystemEnumerationNames()).toEqual(expect.arrayContaining(expectedNames))
  })
})
