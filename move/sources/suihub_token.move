/// # SuiHub Token (SH) Module
///
/// This module defines a fungible token named "SuiHub Token" (SH) with a fixed supply.
/// It utilizes a `TreasuryCap` to manage minting operations, ensuring that only the
/// owner of the `TreasuryCap` can create new tokens. Upon initialization, the contract
/// sets up the token's metadata and transfers the `TreasuryCap` to the deploying address.
///
/// ## Key Features
/// - **Fixed Supply:** The total supply of SH is capped at 10,000,000.
/// - **Minting Control:** Only the holder of the `TreasuryCap` can mint new tokens.
/// - **One-Time Witness (OTW):** Ensures that certain actions, like creating a coin,
///   can only occur once.
/// - **Metadata Management:** Sets up token metadata, including symbol, name, description,
///   and logo URL, and freezes it to prevent further modifications.

module suihub_token::suihub_token;

use sui::coin::{Self, Coin, DenyCapV2, TreasuryCap};
use sui::deny_list::DenyList;

/// ## Error Codes
///
/// | Code | Description               |
/// |------|---------------------------|
/// | 0    | Exceeds the maximum supply|

/// Error code for exceeding the supply limit.
const ESupplyExceeded: u64 = 0;

/// The maximum allowable supply for SuiHub Token (SH).
const MAX_SUPPLY: u64 = 10_000_000;

/// ## SuiHub Token Struct
///
/// Represents the SuiHub Token and serves as a one-time witness (OTW).
///
/// ### Properties of a One-Time Witness (OTW):
/// - The name matches the module's name in uppercase.
/// - Possesses only the `drop` ability.
/// - Contains no fields or a single `bool` field.
///
/// These properties ensure that the OTW can only be instantiated once, preventing
/// multiple instances that could lead to unauthorized minting.

public struct SUIHUB_TOKEN has drop {}

/// ## Module Initializer Function: `init`
///
/// The `init` function is a special initializer that is executed only once when the
/// module is published. It sets up the initial state of the token, including creating
/// the `TreasuryCap` and transferring it to the deploying address.
///
/// ### Properties of `init`:
/// - **Name:** Must be `init`.
/// - **Parameters:** Ends with either a `&mut TxContext` or a `&TxContext`.
/// - **Return:** No return values.
/// - **Visibility:** Private.
/// - **Parameters (Optional):** Can accept the module's OTW by value.
///
/// ### Parameters:
/// - `otw: SUIHUB_TOKEN` - The one-time witness for the token.
/// - `ctx: &mut TxContext` - The mutable transaction context.
fun init(otw: SUIHUB_TOKEN, ctx: &mut TxContext) {
    // Creates a new currency using `create_currency`, but with an extra capability that
    // allows for specific addresses to have their coins frozen. Those addresses cannot interact
    // with the coin as input objects.
    let (treasury_cap, deny_cap, meta_data) = coin::create_regulated_currency_v2(
        otw,
        2,
        b"$HADRON_TOKEN",
        b"Hadron Token",
        b"A demonstration Hadron Token.",
        option::none(),
        true,
        ctx,
    );

    let sender = tx_context::sender(ctx);
    transfer::public_transfer(treasury_cap, sender);
    transfer::public_transfer(deny_cap, sender);
    transfer::public_transfer(meta_data, sender);
}

/// ## Mint Function: `mint`
///
/// Allows the authorized holder of the `TreasuryCap` to mint a specified amount of SH
/// and transfer it to a recipient.
///
/// ### Entry Function:
/// Marked as `public entry` to expose it for external transactions.
///
/// ### Parameters:
/// - `c: &mut TreasuryCap<SUIHUB_TOKEN>` - The mutable treasury cap for SH.
/// - `amount: u64` - The amount of SH to mint.
/// - `recipient: address` - The address to receive the minted SH.
/// - `ctx: &mut TxContext` - The mutable transaction context.
///
/// ### Behavior:
/// - **Supply Check:** Ensures that minting the specified amount does not exceed `MAX_SUPPLY`.
/// - **Mint and Transfer:** Mints the SH and transfers it to the recipient.
///
/// ### Errors:
/// - `ESupplyExceeded`: Thrown if the new total supply would surpass `MAX_SUPPLY`.
public entry fun mint(
    c: &mut TreasuryCap<SUIHUB_TOKEN>,
    amount: u64,
    recipient: address,
    ctx: &mut TxContext,
) {
    // Ensure that the total supply does not exceed 10,000,000
    assert!(c.total_supply() + amount <= MAX_SUPPLY, ESupplyExceeded);
    // Mint the specified amount of SH and transfer it to the recipient
    coin::mint_and_transfer(c, amount, recipient, ctx);
}

public entry fun burn(cap: &mut TreasuryCap<SUIHUB_TOKEN>, c: Coin<SUIHUB_TOKEN>): u64 {
    cap.burn(c)
}

public entry fun add_to_deny_list(
    deny_list: &mut DenyList,
    _deny_cap: &mut DenyCapV2<SUIHUB_TOKEN>,
    addr: address,
    ctx: &mut TxContext,
) {
    sui::coin::deny_list_v2_add(
        deny_list,
        _deny_cap,
        addr,
        ctx,
    )
}

public entry fun remove_from_deny_list(
    deny_list: &mut DenyList,
    _deny_cap: &mut DenyCapV2<SUIHUB_TOKEN>,
    addr: address,
    ctx: &mut TxContext,
) {
    sui::coin::deny_list_v2_remove(
        deny_list,
        _deny_cap,
        addr,
        ctx,
    )
}
