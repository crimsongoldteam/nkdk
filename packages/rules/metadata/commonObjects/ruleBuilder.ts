export type ExactRuleParams<Allowed, Params extends Allowed> = Params &
  Record<Exclude<keyof Params, keyof Allowed>, never>

export function definePropertyRule<const Type extends string, const Params extends object>(
  type: Type,
  params: Params
): Readonly<{ type: Type } & Params> {
  return { type, ...params }
}
