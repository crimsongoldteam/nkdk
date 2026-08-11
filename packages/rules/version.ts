declare const __NKDK_CORE_VERSION__: string | undefined

export const NKDK_CORE_VERSION =
  typeof __NKDK_CORE_VERSION__ === "string" && __NKDK_CORE_VERSION__.length > 0
    ? __NKDK_CORE_VERSION__
    : "0.0.0-dev"
