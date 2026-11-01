//! A thread-local generation scope, reset on success and on early return.
use std::{cell::RefCell, thread::LocalKey};

pub(super) struct Session<T: Default + 'static>(&'static LocalKey<RefCell<Option<T>>>);

impl<T: Default> Session<T> {
    pub(super) fn enter(state: &'static LocalKey<RefCell<Option<T>>>) -> Self {
        state.with(|current| {
            let mut current = current.borrow_mut();
            assert!(current.is_none(), "nested generation asset session");
            *current = Some(T::default());
        });
        Self(state)
    }

    pub(super) fn take(&self) -> T {
        self.0.with(|current| {
            current
                .borrow_mut()
                .take()
                .expect("generation asset session")
        })
    }
}

impl<T: Default> Drop for Session<T> {
    fn drop(&mut self) {
        self.0.with(|current| {
            current.borrow_mut().take();
        });
    }
}
