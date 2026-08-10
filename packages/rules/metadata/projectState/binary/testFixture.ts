import { afterEach } from "vitest"
import { createBinaryProjectStateStore, type BinaryProjectStateStoreFixture } from "./store"
import { createProjectStateDependencyValidator } from "../../validation/projectStateDependencyValidation"
import type { ProjectStateDependencyValidator } from "../contracts/dependencyValidation"

const fixtures: BinaryProjectStateStoreFixture[] = []

afterEach(() => {
  for (const fixture of fixtures.splice(0)) fixture.store.close()
})

export function createBinaryProjectStateTestFixture(
  dependencyValidator: ProjectStateDependencyValidator = createProjectStateDependencyValidator(),
): BinaryProjectStateStoreFixture {
  const fixture = createBinaryProjectStateStore({
    projectDir: "/project",
    dependencyValidator,
  })
  fixtures.push(fixture)
  return fixture
}
