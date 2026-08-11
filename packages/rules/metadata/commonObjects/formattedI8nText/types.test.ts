import { describe, expect, it } from "vitest"
import type { PropertyToYAML } from "../../ruleRuntime/property/registry"
import type { FormattedI8nTextValueYAML, FormattedI8nTextYAML } from "./types"

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
type Assert<T extends true> = T

export type FormattedI8nTextRegistryTypeCheck = Assert<
  Equal<PropertyToYAML<"FormattedI8nText">, FormattedI8nTextYAML>
>

describe("FormattedI8nText YAML types", () => {
  it("uses value-based YAML for the public alias and property registry", () => {
    const yaml: FormattedI8nTextYAML = {
      Форматированный: "Истина",
      Текст: "<b>Заголовок</>",
    }
    const registryYaml: PropertyToYAML<"FormattedI8nText"> = yaml
    const valueYaml: FormattedI8nTextValueYAML = registryYaml

    expect(valueYaml).toEqual({
      Форматированный: "Истина",
      Текст: "<b>Заголовок</>",
    })
  })
})
