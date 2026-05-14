import { withGraph } from "@nakidka/graph"

import { rowsToCompletionValues, type CompletionRow, type CompletionValue } from "./items"
import {
  graphIdToYamlReference,
  parseTopLevelPropertiesPath,
  projectGraphName,
  scopeIdFromOwner,
} from "./path"
import { findCypherSetForYamlProperty } from "./rules"
import { topLevelYamlKeyAtLine } from "./yamlKey"

type GraphQueryOptions = {
  graphName: string
}

type RunGraphQuery = (
  query: string,
  params: Record<string, unknown>,
  options: GraphQueryOptions,
) => Promise<CompletionRow[]>

export type ResolveYamlCypherCompletionInput = {
  filePath: string
  text: string
  line: number
  runQuery?: RunGraphQuery
}

export async function resolveYamlCypherCompletionValues({
  filePath,
  text,
  line,
  runQuery = runGraphQuery,
}: ResolveYamlCypherCompletionInput): Promise<CompletionValue[]> {
  const owner = parseTopLevelPropertiesPath(filePath)
  if (!owner) return []

  const yamlKey = topLevelYamlKeyAtLine(text, line)
  if (!yamlKey) return []

  const cypherSet = findCypherSetForYamlProperty(owner.dir, yamlKey)
  if (!cypherSet) return []

  try {
    const scope = scopeIdFromOwner(owner)
    const graphName = projectGraphName(owner.projectPath)
    const rows = await runQuery(cypherSet.query, { scope }, { graphName })

    return rowsToCompletionValues(rows).map((item) => {
      const value = graphIdToYamlReference(item.value)
      return {
        ...item,
        value,
        detail: item.detail ?? (value !== item.value ? item.value : undefined),
      }
    })
  } catch {
    return []
  }
}

async function runGraphQuery(
  query: string,
  params: Record<string, unknown>,
  options: GraphQueryOptions,
): Promise<CompletionRow[]> {
  return withGraph((graph) => graph.query(query, params), options)
}
