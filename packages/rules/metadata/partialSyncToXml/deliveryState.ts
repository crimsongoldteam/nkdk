import { updatePendingPartialXmlSync } from "./pendingStore"

interface PartialSyncAttemptIdentity {
  readonly projectDir: string
  readonly componentPath: string
  readonly packageId: string
  readonly attemptId: string
}

export async function markPartialSyncTransferring(
  params: PartialSyncAttemptIdentity & { readonly operationLogProjectPath: string },
): Promise<void> {
  await updatePendingPartialXmlSync({
    projectDir: params.projectDir,
    componentPath: params.componentPath,
    update(state) {
      assertPackage(state.packageId, params.packageId)
      if (state.delivery.status !== "prepared") {
        throw new Error(`Пакет ${params.packageId} не подготовлен к передаче`)
      }
      return {
        ...state,
        delivery: {
          status: "transferring",
          attemptId: params.attemptId,
          operationLogProjectPath: params.operationLogProjectPath,
        },
      }
    },
  })
}

export async function markPartialSyncPreparedAfterRejection(
  params: PartialSyncAttemptIdentity,
): Promise<void> {
  await updateDelivery(params, "prepared")
}

export async function markPartialSyncApplied(
  params: PartialSyncAttemptIdentity,
): Promise<void> {
  await updateDelivery(params, "applied")
}

async function updateDelivery(
  params: PartialSyncAttemptIdentity,
  status: "prepared" | "applied",
): Promise<void> {
  await updatePendingPartialXmlSync({
    projectDir: params.projectDir,
    componentPath: params.componentPath,
    update(state) {
      assertPackage(state.packageId, params.packageId)
      if (state.delivery.status !== "transferring") {
        throw new Error(`Пакет ${params.packageId} не находится в фазе передачи`)
      }
      if (state.delivery.attemptId !== params.attemptId) {
        throw new Error(`Не совпадает идентификатор попытки передачи: ${params.attemptId}`)
      }
      return {
        ...state,
        delivery: status === "prepared"
          ? { status: "prepared" }
          : { ...state.delivery, status: "applied" },
      }
    },
  })
}

function assertPackage(actual: string, expected: string): void {
  if (actual !== expected) throw new Error(`Не совпадает идентификатор ожидающего пакета: ${expected}`)
}
