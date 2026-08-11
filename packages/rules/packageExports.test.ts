import { beforeAll, expect, it } from "vitest"

let packageExports: typeof import("./index")

beforeAll(async () => {
  packageExports = await import("./index")
})

it("exports only metadataRules from the package root", async () => {
  expect(Object.keys(packageExports)).toEqual(["metadataRules"])
  expect(packageExports.metadataRules).toEqual(expect.any(Object))
}, 30_000)
