import { TElement } from "~/lib/metadata/forms/elements/element/types"

export type ImportFunction<T extends TElement> = (value: any) => T
