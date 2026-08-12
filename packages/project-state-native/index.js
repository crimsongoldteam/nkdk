const native = require("./nkdk_project_state_native.darwin-arm64.node")
const openNativeProjectStateReader = native.openProjectStateReader

module.exports = native
module.exports.fillSharedBuffer = native.fillSharedBuffer
module.exports.openProjectStateReader = function openProjectStateReader(sections) {
  let reader
  try {
    reader = openNativeProjectStateReader(sections)
  } catch (error) {
    throw withCode(error, "PROJECT_STATE_INVALID_SNAPSHOT")
  }
  return {
    close: () => reader.close(),
    filePaths: () => reader.filePaths(),
    stats: () => reader.stats(),
    validateDependencyPage(input) {
      try {
        return reader.validateDependencyPage(input)
      } catch (error) {
        throw withCode(error, "PROJECT_STATE_INVALID_DEPENDENCY_VALIDATION")
      }
    },
    planDependencyValidation(input) {
      let plan
      try {
        plan = reader.planDependencyValidation(input)
      } catch (error) {
        throw withCode(error, "PROJECT_STATE_INVALID_DEPENDENCY_VALIDATION")
      }
      return {
        nextPage() {
          try {
            return plan.nextPage()
          } catch (error) {
            throw withCode(error, "PROJECT_STATE_INVALID_DEPENDENCY_VALIDATION")
          }
        },
        close: () => plan.close(),
      }
    },
    execute(request) {
      try {
        return reader.execute(request)
      } catch (error) {
        throw withCode(
          error,
          error.message.startsWith("Неизвестная операция ProjectState:")
            ? "PROJECT_STATE_UNKNOWN_OPERATION"
            : "PROJECT_STATE_INVALID_QUERY",
        )
      }
    },
  }
}
module.exports.probeSharedBuffer = native.probeSharedBuffer

function withCode(error, code) {
  error.code = code
  return error
}
