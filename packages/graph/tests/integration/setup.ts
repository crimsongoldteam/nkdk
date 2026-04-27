import { GenericContainer, type StartedTestContainer } from "testcontainers"

let container: StartedTestContainer | undefined

export const startFalkorDB = async (): Promise<{ url: string }> => {
  container = await new GenericContainer("falkordb/falkordb:latest")
    .withExposedPorts(6379)
    .start()
  const port = container.getMappedPort(6379)
  return { url: `redis://localhost:${port}` }
}

export const stopFalkorDB = async (): Promise<void> => {
  if (container !== undefined) {
    await container.stop()
    container = undefined
  }
}
