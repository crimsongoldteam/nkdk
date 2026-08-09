import { describe, expect, it } from "vitest"
import { runRegisteredProjectValidationGenerator } from "./generateProjectValidationAjvStandalone"

describe("standalone validation generator entry", () => {
  it("регистрирует metadata до загрузки реализации", async () => {
    const trace: string[] = []

    await runRegisteredProjectValidationGenerator(
      { outfile: "/tmp/project-validation.js" },
      {
        register: () => trace.push("register"),
        loadImplementation: async () => {
          trace.push("load")
          return {
            generate: async () => {
              trace.push("generate")
            },
          }
        },
      },
    )

    expect(trace).toEqual(["register", "load", "generate"])
  })
})
