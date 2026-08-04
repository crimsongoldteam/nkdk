import { afterEach } from "vitest"
import { createBinaryProjectStateStore, type BinaryProjectStateStoreFixture } from "./store"

const fixtures: BinaryProjectStateStoreFixture[] = []

afterEach(() => {
  for (const fixture of fixtures.splice(0)) fixture.store.close()
})

export function createBinaryProjectStateTestFixture(): BinaryProjectStateStoreFixture {
  const fixture = createBinaryProjectStateStore({ projectDir: "/project" })
  fixtures.push(fixture)
  return fixture
}
