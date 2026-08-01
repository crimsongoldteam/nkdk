import { describe, expect, it } from "vitest"
import { createSqliteFirstPassExperimentProducer } from "./sqliteFirstPassExperimentProducer"
import { encodeSqliteFirstPassExperimentFile } from "./sqliteFirstPassExperimentProtocol"
import { createSqliteFirstPassExperimentSession } from "./sqliteFirstPassExperimentSession"

function record(path: string) {
  return encodeSqliteFirstPassExperimentFile({
    componentPath: "cf",
    rootProjectPath: path,
    contributedFacts: true,
    diagnostics: [],
    objectRecords: [{ path }],
    objectIndexEntries: [{ path }],
    memberIndexEntries: [],
    valueIndexEntries: [],
    pendingReferences: [],
    pendingChecks: [],
  })
}

describe("SQLite first-pass experiment session", () => {
  it("combines contributions from two producers in one in-memory database", async () => {
    const session = createSqliteFirstPassExperimentSession(2)
    const producers = session.producerPorts.map((port) =>
      createSqliteFirstPassExperimentProducer(port, { maxBatchBytes: 1 }),
    )

    await Promise.all([
      producers[0]!.append(record("cf/A.yaml")),
      producers[1]!.append(record("cf/B.yaml")),
    ])
    await Promise.all(producers.map((producer) => producer.finish()))

    await expect(session.result).resolves.toMatchObject({
      files: 2,
      objectRecords: 2,
      objectIndexEntries: 2,
      batches: 2,
      maxInFlightBatches: 1,
      quickCheck: "ok",
    })
    await session.close()
  })
})
