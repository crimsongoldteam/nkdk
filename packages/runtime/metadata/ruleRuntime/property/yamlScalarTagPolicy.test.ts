import { describe, expect, it } from "vitest"
import { assertYAMLScalarTagAllowed } from "./yamlScalarTagPolicy"

describe("YAML scalar tag policy", () => {
  it.each([undefined, "проверять", "изменять"] as const)(
    "allows the shared tag %s without a type policy",
    (tag) => expect(() => assertYAMLScalarTagAllowed({ tag })).not.toThrow(),
  )

  it("allows a registered XML representation tag", () => {
    expect(() => assertYAMLScalarTagAllowed({
      tag: "xml/string",
      policy: { acceptedTags: ["xml/string"] },
    })).not.toThrow()
  })

  it("rejects an XML representation tag without type support", () => {
    expect(() => assertYAMLScalarTagAllowed({ tag: "xml/string" }))
      .toThrow("Тег !xml/string недопустим для этого типа свойства")
  })
})
