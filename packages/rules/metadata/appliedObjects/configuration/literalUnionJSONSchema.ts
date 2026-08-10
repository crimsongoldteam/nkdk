import { Type } from "typebox"

export const literalUnionJSONSchema = (values: readonly string[]) =>
  Type.Union(
    values.map((value) => Type.Literal(value)) as [
      ReturnType<typeof Type.Literal>,
      ReturnType<typeof Type.Literal>,
      ...ReturnType<typeof Type.Literal>[],
    ]
  )
