import { afterEach, describe, expect, it } from "vitest"
import { createProjectStateDependencyValidator } from "../../validation/projectStateDependencyValidation"
import { runProjectStateStoreContract, type ProjectStateStoreContractFixture } from "../storeContract"
import { openRustProjectStateReadSession } from "./readSession"
import { createRustProjectStateStore, readLastRustProjectStateValidationStats } from "./store"
import type { ProjectStateReadToken } from "../contracts"

describe("Rust ProjectState store", () => {
  const fixtures: ProjectStateStoreContractFixture[] = []
  afterEach(() => fixtures.splice(0).forEach(({ store }) => store.close()))

  runProjectStateStoreContract(() => {
    const dependencyValidator = createProjectStateDependencyValidator()
    const fixture = {
      store: createRustProjectStateStore({ projectDir: "/project", dependencyValidator }),
      openReadSession: (token: ProjectStateReadToken) => openRustProjectStateReadSession(token, dependencyValidator),
    }
    fixtures.push(fixture)
    return fixture
  })

  it("проверяет зависимости через постраничный Rust-планировщик", () => {
    const store = createRustProjectStateStore({
      projectDir: "/project",
      dependencyValidator: createProjectStateDependencyValidator(),
    })
    fixtures.push({ store, openReadSession: (token) => openRustProjectStateReadSession(
      token,
      createProjectStateDependencyValidator(),
    ) })

    expect(store.validateDependencyDiagnosticBatches?.({ requests: [] })).toHaveLength(1)
    expect(readLastRustProjectStateValidationStats()).toEqual({
      pages: 1,
      deferredRows: 0,
      nativeDiagnostics: 1,
      maxNativeTemporaryBytes: expect.any(Number),
    })
  })
})
