import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement, BaseElementEnterprise } from "./baseElement/types"

export type ImportFromEnterpriseReturn<
  From extends BaseElementEnterprise | undefined,
  To extends BaseElement | undefined,
  Name extends string | undefined,
> = From extends undefined ? undefined : Name extends undefined ? Partial<To> : To

export type ImportExportReturn<F, T> = F extends undefined ? undefined : T

export interface ImportFromEnterpriseFunction<
  From extends BaseElementEnterprise | undefined,
  To extends BaseElement | undefined,
  Name extends string | undefined,
> {
  (context: ConfigurationContext, data: From, name: Name): To
}

export type ImportExportFunction<From, To> = (
  context: ConfigurationContext,
  data: From
) => From extends undefined ? undefined : To
