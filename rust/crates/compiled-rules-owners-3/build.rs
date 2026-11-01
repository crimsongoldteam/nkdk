#[path = "../../build-support/production.rs"]
mod production;
fn main() {
    production::build(production::Group::Secondary3);
}
