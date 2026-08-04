import type { ProjectStateComponentProjection } from "../../projectState"
import type { ComponentHashState, ComponentProjectStructure } from "./types"

export async function readComponentHashState(params: {
  readonly structure: ComponentProjectStructure
  readonly projection: ProjectStateComponentProjection
}): Promise<ComponentHashState> {
  if (params.projection.componentPath !== params.structure.componentPath) {
    throw new Error("Проекция состояния относится к другому компоненту")
  }
  const { hashBytes } = params.projection
  const expectedLength = params.projection.projectFiles.length * 8
  if (hashBytes.byteOffset !== 0 || hashBytes.byteLength !== expectedLength || hashBytes.buffer.byteLength !== expectedLength) {
    throw new Error(`Проекция состояния должна владеть общим буфером хэшей длиной ${expectedLength} байт`)
  }
  const view = new DataView(hashBytes.buffer)
  return {
    componentPath: params.structure.componentPath,
    projectFiles: params.projection.projectFiles.map(({ projectPath }, index) => {
      const prefix = `${params.structure.componentPath}/`
      if (!projectPath.startsWith(prefix)) throw new Error(`Путь проекции не принадлежит компоненту: ${projectPath}`)
      return {
        projectPath: projectPath.slice(prefix.length),
        contentHash: view.getBigUint64(index * 8, false),
      }
    }).sort((left, right) => Buffer.compare(Buffer.from(left.projectPath), Buffer.from(right.projectPath))),
  }
}
