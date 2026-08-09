import { describe, expect, it, vi } from "vitest"
import { runRegisteredProjectValidationGenerator } from "./generateProjectValidationAjvStandaloneEntry"

describe("runRegisteredProjectValidationGenerator", () => {
  it("регистрирует metadata до загрузки реализации генератора", async () => {
    const calls: string[] = []
    const generate = vi.fn(async () => {
      calls.push("generate")
    })

    await runRegisteredProjectValidationGenerator(
      { outfile: "/tmp/project-validation.js" },
      {
        register() {
          calls.push("register")
        },
        async loadImplementation() {
          calls.push("load")
          return { generate }
        },
      }
    )

    expect(calls).toEqual(["register", "load", "generate"])
    expect(generate).toHaveBeenCalledWith({ outfile: "/tmp/project-validation.js" })
  })
})
