import type {
  DataPathContribution,
  TypedDataPathMemberDeclaration,
} from "@nkdk/runtime/rule-kit"

export function builtInStructuredDataPathRules(params: {
  readonly type: string
  readonly aliases: readonly string[]
  readonly members: readonly TypedDataPathMemberDeclaration[]
  readonly conditionalMembers: readonly string[]
}): readonly DataPathContribution[] {
  return [
    { kind: "typedGraph", types: [{ type: params.type, aliases: params.aliases, members: params.members }] },
    {
      kind: "dataPathView",
      view: {
        purpose: "formConditionalFilter",
        types: { [params.type]: params.conditionalMembers },
      },
    },
    {
      kind: "formattingNamePairs",
      pairs: params.members.map(({ internal, yaml }) => ({ internal, yaml })),
    },
    {
      kind: "typeResolver",
      resolver: ({ baseType }) => baseType === params.type || params.aliases.includes(baseType)
        ? {
            kinds: ["structured"],
            nextTypes: [],
            terminalTypes: [params.type],
            structuredType: params.type,
            sourceText: params.type,
          }
        : undefined,
    },
  ]
}
