import { afterEach } from "vitest"
import { createBinaryProjectStateStore, type BinaryProjectStateStoreFixture } from "./store"
import { createProjectStateDependencyValidator } from "../../validation/projectStateDependencyValidation"

const fixtures: BinaryProjectStateStoreFixture[] = []

afterEach(() => {
  for (const fixture of fixtures.splice(0)) fixture.store.close()
})

export function createBinaryProjectStateTestFixture(): BinaryProjectStateStoreFixture {
  const fixture = createBinaryProjectStateStore({
    projectDir: "/project",
    dependencyValidator: createProjectStateDependencyValidator(),
  })
  fixtures.push(fixture)
  return fixture
}
