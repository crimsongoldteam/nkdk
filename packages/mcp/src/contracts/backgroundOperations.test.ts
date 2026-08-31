import { Value } from "typebox/value"
import { describe, expect, it } from "vitest"
import {
  backgroundOperationAcceptedSchema,
  backgroundOperationSnapshotSchema,
  cancelOperationInputSchema,
  getOperationInputSchema,
} from "./backgroundOperations"

const base = {
  ok: true,
  operationId: "019d-operation",
  operationKind: "validate_project",
  projectDir: "C:/project",
  createdAt: "2026-08-30T18:00:00.000Z",
  updatedAt: "2026-08-30T18:00:01.000Z",
  stage: "validation",
  messages: [],
} as const

describe("background operation contracts", () => {
  it("accepts the immediate start response and rejects extra fields", () => {
    const accepted = {
      ok: true,
      status: "accepted",
      operationId: "019d-operation",
      operationKind: "sync_to_infobase",
      projectDir: "C:/project",
    }

    expect(Value.Check(backgroundOperationAcceptedSchema, accepted)).toBe(true)
    expect(Value.Check(backgroundOperationAcceptedSchema, { ...accepted, result: {} })).toBe(false)
  })

  it.each(["queued", "running", "cancelled", "interrupted"] as const)(
    "accepts %s snapshots",
    (status) => {
      expect(Value.Check(backgroundOperationSnapshotSchema, { ...base, status })).toBe(true)
    },
  )

  it("accepts typed successful results", () => {
    expect(Value.Check(backgroundOperationSnapshotSchema, {
      ...base,
      status: "succeeded",
      result: {
        ok: true,
        diagnostics: [],
        summary: { errors: 0, warnings: 0, shown: 0, omitted: 0 },
        truncated: false,
      },
    })).toBe(true)

    expect(Value.Check(backgroundOperationSnapshotSchema, {
      ...base,
      status: "succeeded",
      operationKind: "validate_project",
      result: { ok: true, reset: true },
    })).toBe(false)
  })

  it("accepts normalized failures", () => {
    expect(Value.Check(backgroundOperationSnapshotSchema, {
      ...base,
      status: "failed",
      error: { code: "core_error", message: "failure" },
    })).toBe(true)
  })

  it("keeps lookup inputs strict", () => {
    const input = { projectDir: "C:/project", operationId: "019d-operation" }
    expect(Value.Check(getOperationInputSchema, input)).toBe(true)
    expect(Value.Check(cancelOperationInputSchema, input)).toBe(true)
    expect(Value.Check(getOperationInputSchema, { ...input, password: "secret" })).toBe(false)
  })
})
