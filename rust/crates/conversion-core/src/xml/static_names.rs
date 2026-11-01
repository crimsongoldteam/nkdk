//! Cache a context-free root traversal, never a truncated recursive subgraph.
use std::{cell::Cell, sync::OnceLock};

type Names = Vec<(&'static str, &'static str)>;
thread_local! { static ACTIVE: Cell<bool> = const { Cell::new(false) }; }

#[derive(Default)]
pub struct StaticNames(OnceLock<Names>);
impl StaticNames {
    pub const fn new() -> Self {
        Self(OnceLock::new())
    }

    /// `build` must depend only on the compiled declaration, not input values.
    /// Nested traversals bypass caches because recursion guards can truncate
    /// their result. The outermost traversal still visits the complete graph.
    pub fn get(&self, build: impl FnOnce() -> Names) -> Names {
        if ACTIVE.with(|active| active.replace(true)) {
            return build();
        }
        struct Root;
        impl Drop for Root {
            fn drop(&mut self) {
                ACTIVE.with(|active| active.set(false));
            }
        }
        let _root = Root;
        self.0.get_or_init(build).clone()
    }
}
