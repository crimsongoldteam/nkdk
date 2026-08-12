import { afterEach, describe } from "vitest"
import { createProjectStateDependencyValidator } from "../../validation/projectStateDependencyValidation"
import { runProjectStateStoreContract, type ProjectStateStoreContractFixture } from "../storeContract"
import { openRustProjectStateReadSession } from "./readSession"
import { createRustProjectStateStore } from "./store"
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
})
