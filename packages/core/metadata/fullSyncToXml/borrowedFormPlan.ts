import type { FullXmlSyncProfileRuntime } from "./componentProfile"
import type { FullXmlSyncPlan } from "./types"

export function attachBorrowedFormPaths(
  plan: FullXmlSyncPlan,
  runtime: Pick<FullXmlSyncProfileRuntime, "borrowedForms">,
): FullXmlSyncPlan {
  const borrowedByAddress = new Map(
    (runtime.borrowedForms ?? []).map((form) => [form.logicalAddress, form])
  )
  return {
    ...plan,
    assignments: plan.assignments.map((assignment) => {
      const borrowed = borrowedByAddress.get(assignment.logicalAddress)
      return borrowed === undefined
        ? assignment
        : {
            ...assignment,
            baseFormPaths: {
              baseProjectPath: borrowed.baseProjectPath,
              ...(borrowed.savedProjectPath === undefined
                ? {}
                : { savedProjectPath: borrowed.savedProjectPath }),
            },
          }
    }),
  }
}
