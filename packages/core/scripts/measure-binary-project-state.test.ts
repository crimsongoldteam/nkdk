import { describe, expect, it } from "vitest"
import { parseMeasureBinaryProjectStateArgs } from "./measure-binary-project-state"

describe("measure binary project state args", () => {
  it("разбирает каталог, число поисков и число worker", () => {
    expect(parseMeasureBinaryProjectStateArgs([
      "--",
      "/tmp/project",
      "--lookups", "1000000",
      "--workers", "4",
    ])).toEqual({ projectDir: "/tmp/project", lookups: 1_000_000, workers: 4 })
  })
})
