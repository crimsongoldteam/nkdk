import { describe, expect, it } from "vitest"

import {
  attachXmlImportAttemptAdapter,
  createXmlImportAttemptJournal,
} from "./attempt"

describe("XML import attempt journal", () => {
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
})
