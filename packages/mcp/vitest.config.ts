import { unitIntegrationVitestConfig } from "../../scripts/vitest/unit-integration-projects"

export default unitIntegrationVitestConfig(import.meta.url, {
  environment: "node",
  globals: true,
  testTimeout: 10_000,
  watch: false,
})
