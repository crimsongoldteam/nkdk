import { fixtureConfigPath, fixturesRoot } from "./paths.mjs"
import { runDepcruise } from "./run-depcruise.mjs"

export function cruiseFixture() {
  const result = runDepcruise(
    "dependency-cruise",
    ["--config", fixtureConfigPath, "--output-type", "json", "packages"],
    { cwd: fixturesRoot }
  )

  return JSON.parse(result.stdout)
}
