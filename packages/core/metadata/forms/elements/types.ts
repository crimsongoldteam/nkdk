import { BaseElement, BaseElementEnterprise } from "./baseElement/types"

export type ImportFromEnterpriseReturn<
  From extends BaseElementEnterprise | undefined,
  To extends BaseElement | undefined,
  Name extends string | undefined,
> = From extends undefined ? undefined : Name extends undefined ? Partial<To> : To

export type ImportExportReturn<From, To> = From extends undefined ? undefined : To
