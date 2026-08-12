use napi::bindgen_prelude::Uint8Array;
use napi_derive::napi;

#[napi(object)]
pub struct ProjectStateSections {
    pub header: Uint8Array,
    pub strings: Uint8Array,
    pub files: Uint8Array,
    pub facts: Uint8Array,
    pub lookups: Uint8Array,
    pub diagnostics: Uint8Array,
}

impl ProjectStateSections {
    pub fn ordered(&self) -> [&[u8]; 5] {
        [
            self.strings.as_ref(),
            self.files.as_ref(),
            self.facts.as_ref(),
            self.lookups.as_ref(),
            self.diagnostics.as_ref(),
        ]
    }
}
