export function throwIfOperationCancelled(signal?: AbortSignal): void {
  if (signal?.aborted === true) throw new DOMException("Операция отменена", "AbortError")
}

export function rethrowOperationCancellation(error: unknown): void {
  if (error instanceof DOMException && error.name === "AbortError") throw error
}
