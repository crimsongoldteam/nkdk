//! Stable identity derivation during operation preparation, never per-field state.
mod address;
use super::FactState;
pub use address::LogicalAddress;
use sha2::{Digest, Sha256};
use std::borrow::Cow;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum IdentityFormat {
    Uuid,
    Hex128,
    Hex160,
}

pub struct OperationIdentity {
    prefix: Sha256,
}

impl OperationIdentity {
    /// The operation boundary supplies one seed; the prepared prefix is reused.
    pub fn new(seed: [u8; 32]) -> Self {
        let mut prefix = Sha256::new();
        prefix.update(seed);
        prefix.update([0]);
        Self { prefix }
    }

    /// Unavailable or ambiguous indexes never authorize a replacement identity.
    pub fn resolve<'a>(
        &self,
        previous: FactState<&'a str>,
        domain: &str,
        format: IdentityFormat,
        address: &LogicalAddress,
    ) -> FactState<Cow<'a, str>> {
        match previous {
            FactState::Ready(value) => FactState::Ready(Cow::Borrowed(value)),
            FactState::Missing => {
                FactState::Ready(Cow::Owned(self.generate(domain, format, address.as_str())))
            }
            FactState::Ambiguous => FactState::Ambiguous,
            FactState::Cycle => FactState::Cycle,
            FactState::Unready => FactState::Unready,
        }
    }

    fn generate(&self, domain: &str, format: IdentityFormat, address: &str) -> String {
        let count = match format {
            IdentityFormat::Uuid | IdentityFormat::Hex128 => 16,
            IdentityFormat::Hex160 => 20,
        };
        let mut hash = self.prefix.clone();
        hash.update(domain.as_bytes());
        hash.update([0]);
        hash.update(address.as_bytes());
        let mut bytes = hash.finalize();
        let uuid = format == IdentityFormat::Uuid;
        if uuid {
            bytes[6] = (bytes[6] & 0x0f) | 0x40;
            bytes[8] = (bytes[8] & 0x3f) | 0x80;
        }
        const HEX: &[u8; 16] = b"0123456789abcdef";
        let mut value = String::with_capacity(count * 2 + if uuid { 4 } else { 0 });
        for (index, byte) in bytes[..count].iter().copied().enumerate() {
            if uuid && matches!(index, 4 | 6 | 8 | 10) {
                value.push('-');
            }
            value.push(HEX[(byte >> 4) as usize] as char);
            value.push(HEX[(byte & 0x0f) as usize] as char);
        }
        value
    }
}

/// Resolve an operation seed written as 64 hexadecimal characters. The seed is
/// supplied at the operation boundary and never persisted in a fact snapshot.
pub fn derive(
    seed: &str,
    domain: &str,
    format: IdentityFormat,
    segments: &[&str],
) -> crate::Result<String> {
    let bytes = seed.as_bytes();
    if bytes.len() != 64 {
        return Err(crate::RuntimeDiagnostic::new(
            "identity.seed",
            "Operation identity seed must contain 64 hexadecimal characters",
        ));
    }
    let mut decoded = [0_u8; 32];
    for (index, pair) in bytes.as_chunks::<2>().0.iter().enumerate() {
        let high = (pair[0] as char).to_digit(16);
        let low = (pair[1] as char).to_digit(16);
        let (Some(high), Some(low)) = (high, low) else {
            return Err(crate::RuntimeDiagnostic::new(
                "identity.seed",
                "Operation identity seed contains a non-hexadecimal character",
            ));
        };
        decoded[index] = ((high << 4) | low) as u8;
    }
    let address = LogicalAddress::from_segments(segments.iter().copied())?;
    let FactState::Ready(value) =
        OperationIdentity::new(decoded).resolve(FactState::Missing, domain, format, &address)
    else {
        unreachable!("a missing identity is always generated")
    };
    Ok(value.into_owned())
}
