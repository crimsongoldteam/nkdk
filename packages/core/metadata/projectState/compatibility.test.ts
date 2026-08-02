import { describe, expect, it } from "vitest"
import {
  createProjectStateCompatibility,
  fingerprintProjectStateRulesSnapshot,
} from "./compatibility"

describe("ProjectState compatibility", () => {
  it("стабилизирует отпечаток относительно порядка регистраций", () => {
    const first = fingerprintProjectStateRulesSnapshot({
      projectSpecs: [{ dir: "Б", kind: "b" }, { dir: "А", kind: "a" }],
      schemas: { B: { type: "string" }, A: { type: "number", required: ["b", "a"] } },
      localRules: ["second", "first"],
    })
    const second = fingerprintProjectStateRulesSnapshot({
      localRules: ["first", "second"],
      schemas: { A: { required: ["b", "a"], type: "number" }, B: { type: "string" } },
      projectSpecs: [{ kind: "a", dir: "А" }, { kind: "b", dir: "Б" }],
    })
    const changedSchema = fingerprintProjectStateRulesSnapshot({
      projectSpecs: [{ dir: "А", kind: "a" }, { dir: "Б", kind: "b" }],
      schemas: { A: { required: ["b", "a"], type: "boolean" }, B: { type: "string" } },
      localRules: ["first", "second"],
    })

    expect(first).toBe(second)
    expect(changedSchema).not.toBe(first)
  })

  it("формирует полный набор отпечатков после регистрации core metadata", () => {
    const actual = createProjectStateCompatibility("producer-test")

    expect(actual).toEqual({
      schemaVersion: 1,
      producerVersion: "producer-test",
      rulesFingerprint: expect.stringMatching(/^[a-f0-9]{64}$/),
      hashAlgorithm: "xxhash64-be-v1",
    })
  })
})
