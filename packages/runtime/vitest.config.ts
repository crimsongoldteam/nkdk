import { unitIntegrationVitestConfig } from "../../scripts/vitest/unit-integration-projects"

// Each unit file gets a separate VM context; recycle the worker before retained
// module contexts can grow without bound. Native integration keeps its pool.
export default unitIntegrationVitestConfig(import.meta.url, {}, {
  pool: "vmThreads",
  vmMemoryLimit: "256MB",
})
