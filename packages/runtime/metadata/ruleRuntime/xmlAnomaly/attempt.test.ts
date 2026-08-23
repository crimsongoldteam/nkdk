import { describe, expect, it } from "vitest"

import {
  arrayLengthXmlImportAttemptAdapter,
  attachXmlImportAttemptAdapter,
  createXmlImportAttemptJournal,
  XmlImportAttemptInfrastructureError,
  type XmlImportAttemptPhase,
} from "./attempt"

describe("XML import attempt journal", () => {
  it.each<XmlImportAttemptPhase>([
    "begin",
    "prepare",
    "commit",
    "rollback",
    "release",
  ])("маркирует ошибку инфраструктурной фазы %s и сохраняет cause", (phase) => {
    const participant = {}
    const cause = new Error(`${phase} failed`)
    attachXmlImportAttemptAdapter(participant, failingPhaseAdapter(phase, cause))

    const thrown = captureError(() => {
      const attempt = createXmlImportAttemptJournal([participant]).begin()
      if (phase === "rollback") attempt.rollback()
      else attempt.commit()
    })

    expect(thrown).toBeInstanceOf(XmlImportAttemptInfrastructureError)
    expect(thrown).toMatchObject({ phase, cause })
  })

  it("фиксирует успешную попытку постоянным числом служебных вызовов", () => {
    const values: number[] = []
    const calls: string[] = []
    const participant = {}
    attachXmlImportAttemptAdapter(participant, {
      begin() {
        calls.push("begin")
        return values.length
      },
      commit() {
        calls.push("commit")
      },
      rollback(checkpoint) {
        calls.push("rollback")
        values.length = checkpoint as number
      },
    })
    const attempt = createXmlImportAttemptJournal([participant]).begin()

    for (let value = 0; value < 1_000; value += 1) values.push(value)
    attempt.commit()

    expect(values).toHaveLength(1_000)
    expect(calls).toEqual(["begin", "commit"])
  })

  it("откатывает участников в обратном порядке", () => {
    const calls: string[] = []
    const participants = [{ name: "first" }, { name: "second" }]
    for (const participant of participants) {
      attachXmlImportAttemptAdapter(participant, {
        begin() {
          calls.push(`begin:${participant.name}`)
          return participant.name
        },
        commit() {
          calls.push(`commit:${participant.name}`)
        },
        rollback(checkpoint) {
          calls.push(`rollback:${String(checkpoint)}`)
        },
      })
    }

    createXmlImportAttemptJournal(participants).begin().rollback()

    expect(calls).toEqual([
      "begin:first",
      "begin:second",
      "rollback:second",
      "rollback:first",
    ])
  })

  it("проверяет LIFO по уникальному checkpoint даже без записей", () => {
    const participant = {}
    attachXmlImportAttemptAdapter(
      participant,
      arrayLengthXmlImportAttemptAdapter([[]]),
    )
    const journal = createXmlImportAttemptJournal([participant])
    const outer = journal.begin()
    const inner = journal.begin()

    expect(() => outer.commit()).toThrow("порядок XML-import attempts")
    inner.rollback()
    outer.commit()
  })

  it.each([
    {
      name: "shared перед outerOnly",
      order: (shared: object, outerOnly: object) => [shared, outerOnly],
    },
    {
      name: "outerOnly перед shared",
      order: (shared: object, outerOnly: object) => [outerOnly, shared],
    },
  ])(
    "оставляет все checkpoints активными после prepare-конфликта: $name",
    ({ order }) => {
      const sharedValues: string[] = []
      const outerOnlyValues: string[] = []
      const shared = {}
      const outerOnly = {}
      attachXmlImportAttemptAdapter(
        shared,
        arrayLengthXmlImportAttemptAdapter([sharedValues]),
      )
      attachXmlImportAttemptAdapter(
        outerOnly,
        arrayLengthXmlImportAttemptAdapter([outerOnlyValues]),
      )
      const outer = createXmlImportAttemptJournal(
        order(shared, outerOnly),
      ).begin()
      sharedValues.push("outer:shared")
      outerOnlyValues.push("outer:only")
      const inner = createXmlImportAttemptJournal([shared]).begin()
      sharedValues.push("inner:shared")

      const thrown = captureError(() => outer.commit())

      expect(thrown).toBeInstanceOf(XmlImportAttemptInfrastructureError)
      expect(thrown).toMatchObject({ phase: "prepare" })
      expect((thrown as XmlImportAttemptInfrastructureError).cause)
        .toMatchObject({ message: expect.stringContaining("порядок") })
      expect(sharedValues).toEqual(["outer:shared", "inner:shared"])
      expect(outerOnlyValues).toEqual(["outer:only"])

      inner.rollback()
      outer.commit()

      expect(sharedValues).toEqual(["outer:shared"])
      expect(outerOnlyValues).toEqual(["outer:only"])
    },
  )

  it("не компенсирует произвольную prepare-ошибку до явного rollback", () => {
    const calls: string[] = []
    const cause = new Error("prepare rejected")
    const failing = trackedParticipant("failing", calls, cause)
    const prepared = trackedParticipant("prepared", calls)
    const attempt = createXmlImportAttemptJournal([
      failing,
      prepared,
    ]).begin()
    calls.length = 0

    const thrown = captureError(() => attempt.commit())

    expect(thrown).toBeInstanceOf(XmlImportAttemptInfrastructureError)
    expect(thrown).toMatchObject({ phase: "prepare", cause })
    expect(calls).toEqual(["prepare:prepared", "prepare:failing"])

    calls.length = 0
    attempt.rollback()

    expect(calls).toEqual(["rollback:prepared", "rollback:failing"])
  })

  it("откатывает всех участников после ошибки publish", () => {
    const calls: string[] = []
    let published = false
    const failing = {}
    const publishing = {}
    attachXmlImportAttemptAdapter(failing, {
      begin: () => ({ failing: true }),
      commit() {
        calls.push("commit:failing")
        throw new Error("publish failed")
      },
      rollback() {
        calls.push("rollback:failing")
      },
    })
    attachXmlImportAttemptAdapter(publishing, {
      begin: () => ({ publishing: true }),
      commit() {
        calls.push("commit:publishing")
        published = true
      },
      rollback() {
        calls.push("rollback:publishing")
        published = false
      },
    })
    const attempt = createXmlImportAttemptJournal([failing, publishing]).begin()

    expect(() => attempt.commit()).toThrow("publish failed")

    expect(published).toBe(false)
    expect(calls).toEqual([
      "commit:publishing",
      "commit:failing",
      "rollback:publishing",
      "rollback:failing",
    ])
    expect(() => attempt.rollback()).toThrow("уже завершена")
  })

  it("делает best-effort rollback и агрегирует инфраструктурные ошибки", () => {
    const calls: string[] = []
    const participants = throwingParticipants("rollback", calls)
    const attempt = createXmlImportAttemptJournal(participants).begin()
    const thrown = captureError(() => attempt.rollback())

    expect(calls).toEqual(["second", "first"])
    expect(thrown).toBeInstanceOf(AggregateError)
    expect((thrown as AggregateError).errors).toMatchObject([
      { message: "rollback:second" },
      { message: "rollback:first" },
    ])
  })

  it("не теряет ошибку begin при ошибках компенсации", () => {
    const started = {}
    const failing = {}
    attachXmlImportAttemptAdapter(started, {
      begin: () => ({ started: true }),
      commit: () => undefined,
      rollback() {
        throw new Error("rollback failed")
      },
    })
    attachXmlImportAttemptAdapter(failing, {
      begin() {
        throw new Error("begin failed")
      },
      commit: () => undefined,
      rollback: () => undefined,
    })

    const thrown = captureError(() =>
      createXmlImportAttemptJournal([started, failing]).begin()
    )

    expect(thrown).toBeInstanceOf(AggregateError)
    expect((thrown as AggregateError).errors).toMatchObject([
      { message: "begin failed" },
      { message: "rollback failed" },
    ])
  })

  it("освобождает transaction data best-effort", () => {
    const calls: string[] = []
    const participants = throwingParticipants("release", calls)
    const attempt = createXmlImportAttemptJournal(participants).begin()
    const thrown = captureError(() => attempt.commit())

    expect(calls).toEqual(["second", "first"])
    expect(thrown).toBeInstanceOf(AggregateError)
    expect((thrown as AggregateError).errors).toMatchObject([
      { message: "release:second" },
      { message: "release:first" },
    ])
    expect(() => attempt.rollback()).toThrow("уже завершена")
  })
})

function throwingParticipants(
  operation: "rollback" | "release",
  calls: string[],
): object[] {
  return ["first", "second"].map((name) => {
    const participant = {}
    const fail = (): never => {
      calls.push(name)
      throw new Error(`${operation}:${name}`)
    }
    attachXmlImportAttemptAdapter(participant, {
      begin: () => ({ name }),
      commit: () => undefined,
      ...(operation === "release" ? { release: fail } : {}),
      rollback: operation === "rollback" ? fail : () => undefined,
    })
    return participant
  })
}

function trackedParticipant(
  name: string,
  calls: string[],
  prepareFailure?: Error,
): object {
  const participant = {}
  attachXmlImportAttemptAdapter(participant, {
    begin() {
      calls.push(`begin:${name}`)
      return { name }
    },
    prepare() {
      calls.push(`prepare:${name}`)
      if (prepareFailure !== undefined) throw prepareFailure
    },
    commit() {
      calls.push(`commit:${name}`)
    },
    rollback() {
      calls.push(`rollback:${name}`)
    },
    release() {
      calls.push(`release:${name}`)
    },
  })
  return participant
}

function captureError(run: () => unknown): unknown {
  try {
    run()
  } catch (error) {
    return error
  }
  return undefined
}

function failingPhaseAdapter(
  phase: XmlImportAttemptPhase,
  cause: Error,
) {
  const fail = (current: XmlImportAttemptPhase): void => {
    if (phase === current) throw cause
  }
  return {
    begin() {
      fail("begin")
      return {}
    },
    prepare() {
      fail("prepare")
    },
    commit() {
      fail("commit")
    },
    rollback() {
      fail("rollback")
    },
    release() {
      fail("release")
    },
  }
}
