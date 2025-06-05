/// Module: europe
module suihub_cafe::europe;

use suihub_cafe::suihub_cafe::AdminCap;

/// A struct representing the `Europe` Witness with drop capability.
public struct Europe has drop {}

/// Creates a `Europe` Witness.
public fun europe(_: &AdminCap): Europe {
    Europe {}
}
