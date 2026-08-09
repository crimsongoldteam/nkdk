import { registerCoreMetadata } from "../register"

interface GeneratorDependencies {
  register(): void
  loadImplementation(): Promise<{
    generate(params: { outfile: string }): Promise<void>
  }>
}

const defaultDependencies: GeneratorDependencies = {
  register: registerCoreMetadata,
  async loadImplementation() {
    const implementation = await import("./generateProjectValidationAjvStandaloneImplementation")
    return { generate: implementation.generateProjectValidationAjvStandaloneImplementation }
  },
}

export async function runRegisteredProjectValidationGenerator(
  params: { outfile: string },
  dependencies: GeneratorDependencies
): Promise<void> {
  dependencies.register()
  const implementation = await dependencies.loadImplementation()
  await implementation.generate(params)
}

export function generateProjectValidationAjvStandalone(
  params: { outfile: string }
): Promise<void> {
  return runRegisteredProjectValidationGenerator(params, defaultDependencies)
}
