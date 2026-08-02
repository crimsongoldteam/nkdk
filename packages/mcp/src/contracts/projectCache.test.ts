import { Value } from "typebox/value"
import { describe, expect, it } from "vitest"
import { ProjectCacheInput } from "./projectCache"

describe("ProjectCacheInput", () => {
  it("принимает только projectDir и явное разрешение записи", () => {
    expect(Value.Check(ProjectCacheInput, { projectDir: "/project", allowWrite: true })).toBe(true)
    expect(Value.Check(ProjectCacheInput, { projectDir: "/project", allowWrite: false })).toBe(false)
    expect(Value.Check(ProjectCacheInput, { projectDir: "/project", allowWrite: true, extra: 1 })).toBe(false)
  })
})
