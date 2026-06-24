import { describe, expect, it } from "vitest"
import type { PropertyToYAML } from "~/metadata/orchestration/property/registry"
import type { FormattedI8nTextValueYAML, FormattedI8nTextYAML } from "./types"

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
