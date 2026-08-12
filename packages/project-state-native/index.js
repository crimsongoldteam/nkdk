const native = require("./nkdk_project_state_native.darwin-arm64.node")

module.exports = native
module.exports.fillSharedBuffer = native.fillSharedBuffer
module.exports.probeSharedBuffer = native.probeSharedBuffer
