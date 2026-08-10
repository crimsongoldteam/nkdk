import { expect, it } from "vitest"

it("не видит состояние другого проекта", () => {
  expect((globalThis as Record<string, unknown>)["__nkdkVitestProjectIsolation__"]).toBeUndefined()
})
