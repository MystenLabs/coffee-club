/// Module: athens
module suihub_cafe::athens;

use suihub_cafe::suihub_cafe::AdminCap;

/// A struct representing the `Athens` Witness with drop capability.
public struct Athens has drop {}

/// Creates a `Athens` Witness.
public fun athens(_: &AdminCap): Athens {
    Athens {}
}
