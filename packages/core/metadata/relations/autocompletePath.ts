import { graph } from "./graph"

export const autocompletePath = ({ path }: { path: string }): string[] => {
  const [fromName, relLabel] = path.split(".")
  const results: string[] = []
  const startNodes = graph.nodes().filter((id: string) => graph.getNodeAttribute(id, "name") === fromName)
  for (const startId of startNodes) {
    for (const edgeId of graph.outEdges(startId)) {
      if (graph.getEdgeAttribute(edgeId, "yaml") !== relLabel) continue
      const toName = graph.getNodeAttribute(graph.target(edgeId), "name")
      results.push(`${fromName}.${relLabel}.${toName}`)
    }
  }
  return results
}
