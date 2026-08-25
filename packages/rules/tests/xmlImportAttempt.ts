import { expect } from "vitest"

import {
  attachXmlImportAttemptAdapter,
  XmlImportAttemptInfrastructureError,
  type XmlImportAttemptPhase,
} from "@nkdk/runtime"
import { importPropertiesFromXMLToYAML } from "../metadata/ruleRuntime/property/fromXMLToYAML"

type DirectImportParams = Parameters<typeof importPropertiesFromXMLToYAML>[0]
type DirectImportXML = DirectImportParams["sources"][number]["xml"]

export const xmlImportAttemptPhases: readonly XmlImportAttemptPhase[] = [
  "begin",
  "prepare",
  "commit",
  "rollback",
  "release",
]

export function createFailingXmlImportAttempt(params: {
  readonly phase: XmlImportAttemptPhase
  readonly causeMessage: string
  readonly targetAttempt?: number
}) {
  const collector = {
    acceptItem: () => undefined,
    acceptProperty: () => undefined,
    completeValue: () => undefined,
    finish: () => ({ metadata: { events: [] } }),
  }
  const cause = new Error(params.causeMessage)
  const targetAttempt = params.targetAttempt ?? 1
  let attempts = 0
  const fail = (phase: XmlImportAttemptPhase, attempt: number): void => {
    if (params.phase === phase && attempt === targetAttempt) throw cause
  }
  attachXmlImportAttemptAdapter(collector, {
    begin() {
      const checkpoint = ++attempts
      fail("begin", checkpoint)
      return checkpoint
    },
    prepare(checkpoint) {
      fail("prepare", checkpoint as number)
    },
    commit(checkpoint) {
      fail("commit", checkpoint as number)
    },
    rollback(checkpoint) {
      fail("rollback", checkpoint as number)
    },
    release(checkpoint) {
      fail("release", checkpoint as number)
    },
  })
  return { collector, cause }
}

export function captureError(run: () => unknown): unknown {
  try {
    run()
  } catch (error) {
    return error
  }
  return undefined
}

export function captureTestXmlImport(
  params: Omit<
    DirectImportParams,
    "sources" | "yamlPath" | "rulePath"
  > & { readonly xml: DirectImportXML },
): unknown {
  const { xml, ...rest } = params
  return captureError(() => importPropertiesFromXMLToYAML({
    ...rest,
    sources: [{ context: params.context, xml }],
    yamlPath: [],
    rulePath: [],
  }))
}

export function expectXmlImportInfrastructureFailure(params: {
  readonly thrown: unknown
  readonly phase: XmlImportAttemptPhase
  readonly cause: Error
  readonly audit: { rawCandidates(): readonly unknown[] }
}): void {
  expect(params.thrown).toBeInstanceOf(XmlImportAttemptInfrastructureError)
  expect(params.thrown).toMatchObject({ phase: params.phase, cause: params.cause })
  expect(params.audit.rawCandidates()).toEqual([])
}
