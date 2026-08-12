use napi::Result;
use napi::bindgen_prelude::Uint8Array;
use napi_derive::napi;

mod buffers;
mod format;
mod queries;
mod query_protocol;
mod reader;
mod snapshot_plan;

use buffers::ProjectStateSections;
use reader::NativeProjectStateReader;
pub use snapshot_plan::{NativeSnapshotPlan, plan_project_state_snapshot};

#[napi(object)]
pub struct SharedBufferProbe {
    pub byte_length: u32,
    pub first: u32,
}

#[napi]
pub fn probe_shared_buffer(bytes: Uint8Array) -> SharedBufferProbe {
    SharedBufferProbe {
        byte_length: bytes.len() as u32,
        first: bytes.first().copied().unwrap_or_default() as u32,
    }
}

#[napi]
pub fn fill_shared_buffer(mut bytes: Uint8Array, value: u8) {
    // SAFETY: вызов синхронный, а договор функции запрещает параллельный доступ
    // к переданному диапазону до её возврата.
    unsafe { bytes.as_mut() }.fill(value);
}

#[napi]
pub fn open_project_state_reader(
    sections: ProjectStateSections,
) -> Result<NativeProjectStateReader> {
    NativeProjectStateReader::open(sections)
}
