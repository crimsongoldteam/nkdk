import { expect, it } from "vitest"

const marker = "__nkdkVitestProjectIsolation__"

it("оставляет маркер только в окружении первого проекта", () => {
  Object.assign(globalThis, { [marker]: true })
  expect((globalThis as Record<string, unknown>)[marker]).toBe(true)
})
