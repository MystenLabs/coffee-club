/// Module: dubai
module suihub_cafe::dubai;

use suihub_cafe::suihub_cafe::AdminCap;

/// A struct representing the `Dubai` Witness with drop capability.
public struct Dubai has drop {}

/// Creates a `Dubai` Witness.
public fun dubai(_: &AdminCap): Dubai {
    Dubai {}
}
