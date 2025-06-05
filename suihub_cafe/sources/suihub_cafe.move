/// Module: suihub_cafe
module suihub_cafe::suihub_cafe;

use std::string::String;
use sui::clock::Clock;
use sui::dynamic_field;
use sui::event;
use sui::package;
use sui::vec_set::{Self, VecSet};

/// The current version of the shared object.
const VERSION: u8 = 1;

/// Error code indicating an incorrect version.
const EIncorrectVersion: u64 = 0;
const ECafeNotAuthorized: u64 = 1;

/// OTW to create the `Publisher`.
public struct SUIHUB_CAFE has drop {}

public struct SuiHubCafe<phantom T> has key {
    id: UID,
    timestamp_ms: u64,
}

public struct CafeRegistry has key {
    id: UID,
    version: u8,
    cafes: VecSet<ID>,
}

public enum CoffeeType has copy, drop, store {
    Espresso,
    Americano,
    Doppio,
    Long,
    HotWater,
    Coffee,
}

public struct SuiHubCoffee<phantom T> has key, store {
    id: UID,
    cafe: ID,
    timestamp_ms: u64,
    coffee_type: CoffeeType,
}

public struct AppCap has drop, store {
    cafe_name: String,
}

public struct AppKey<phantom T> has copy, drop, store {}

/// A struct for the admin capability with unique ID.
public struct AdminCap has key, store { id: UID }

//------- Events ---------------

public struct CoffeeBrewed has copy, drop {
    id: ID,
}

fun init(otw: SUIHUB_CAFE, ctx: &mut TxContext) {
    package::claim_and_keep(otw, ctx);

    // Transferring the admin capability to the transaction sender.
    transfer::public_transfer(
        AdminCap { id: object::new(ctx) },
        ctx.sender(),
    );

    transfer::share_object(CafeRegistry {
        id: object::new(ctx),
        version: VERSION,
        cafes: vec_set::empty<ID>(),
    })
}

public fun brew<T>(
    cafe: &mut UID,
    cafe_registry: &mut CafeRegistry,
    clock: &Clock,
    coffee_type: CoffeeType,
    ctx: &mut TxContext,
): SuiHubCoffee<T> {
    assert!(cafe_registry.version == VERSION, EIncorrectVersion);
    assert!(is_cafe_authorized<T>(cafe), ECafeNotAuthorized);
    // TODO: Check cafe registry for authorization

    let suihub_coffee = SuiHubCoffee {
        id: object::new(ctx),
        cafe: cafe.uid_to_inner(),
        timestamp_ms: clock.timestamp_ms(),
        coffee_type,
    };

    event::emit(CoffeeBrewed {
        id: object::id(&suihub_coffee),
    });

    suihub_coffee
}

// === Authorization ===

public fun authorize_cafe<T>(_: &AdminCap, cafe: &mut UID, cafe_name: String) {
    dynamic_field::add(
        cafe,
        AppKey<T> {},
        AppCap {
            cafe_name,
        },
    )
}

public fun revoke_authorization<T>(_: &AdminCap, cafe: &mut UID) {
    let AppCap {
        cafe_name: _,
    } = dynamic_field::remove(cafe, AppKey<T> {});
}

public fun is_cafe_authorized<T>(cafe: &UID): bool {
    dynamic_field::exists_<AppKey<T>>(cafe, AppKey {})
}
