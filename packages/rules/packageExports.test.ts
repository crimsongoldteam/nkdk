import { expect, it } from "vitest"

it("exports only metadataRules from the package root", async () => {
  const module = await import("./index")

  expect(Object.keys(module)).toEqual(["metadataRules"])
  expect(module.metadataRules).toEqual(expect.any(Object))
}, 30_000)
