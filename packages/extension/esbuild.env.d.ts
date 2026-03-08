declare module "esbuild" {
  export function context(options: unknown): Promise<{
    watch(): Promise<void>
    rebuild(): Promise<unknown>
    dispose(): void
  }>
}
