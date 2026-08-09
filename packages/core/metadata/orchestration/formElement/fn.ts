import { ExportToEnterpriseFunction } from "../property/fn"

// #endregion
// #region factory

type fnPairs = ["ExportToEnterprise", ExportToEnterpriseFunction]

export type ItemOperationType = fnPairs extends infer T ? (T extends [infer Op, any] ? Op : never) : never

export type OperationFunction<Type extends ItemOperationType> = Extract<fnPairs, [Type, any]>[1]
