/*
/// Module: coffee_club
module coffee_club::coffee_club;
*/

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions


module coffee_club::coffee_club;

use std::string::{Self, String};
use sui::event;


public enum OrderStatus has store {
    Created,
    Processing,
    Completed,
    Cancelled,
}

public enum CafeStatus has store {
    Open,
    Closed,
}

public struct CoffeeClubCap has key, store {
    id: UID,
}

public struct CoffeeClubManager has key, store{
    id: UID,
    coffee_club: ID,
}

public struct CoffeeMember has key, store {
    id: UID,
    coffee_club: ID,
}

public struct CoffeeOrder has key {
    id: UID,
    cafe: ID,
    member: ID,
    status: OrderStatus,
}

public struct CoffeeCafe has key, store {
    id: UID,
    manager: ID,
    name: String,
    location: String,
    description: String,
    status: CafeStatus,
}

// == Events ==

public struct CafeCreated has copy, drop {
    cafe_id: ID,
    creator: address,
}

public struct CoffeeOrderCreated has copy, drop {
    order_id: ID,
}

const ENotCoffeeClubAdmin: u64 = 0;


// == Functions ==

fun init(ctx: &mut TxContext) {
          transfer::transfer(CoffeeClubCap { id: object::new(ctx) }, ctx.sender());
}

public fun add_manager(coffee_club: &CoffeeClubCap, recipient: address, ctx: &mut TxContext) {
    let manager = CoffeeClubManager { id: object::new(ctx), coffee_club: object::id(coffee_club) };
    transfer::transfer(manager, recipient);
}

public fun delete_manager(coffee_club: &CoffeeClubCap, manager: CoffeeClubManager) {
    // check if manager coffee_club id matches coffeeclubcap id
    assert!(object::id(coffee_club) == manager.coffee_club, ENotCoffeeClubAdmin);
    let CoffeeClubManager { id, coffee_club: _ } = manager;
    object::delete(id);
}


#[allow(lint(self_transfer))]
public fun create_cafe(manager: &CoffeeClubManager, name: String, location: String, description: String, ctx: &mut TxContext) {
    let cafe = CoffeeCafe { id: object::new(ctx), manager: object::id(manager), name: name, location: location, description: description, status: CafeStatus::Closed };
    event::emit(CafeCreated {
        cafe_id: object::id(&cafe),
        creator: ctx.sender(),
    });

    transfer::transfer(cafe, ctx.sender());
}

public fun create_member(coffee_club_id: ID, ctx: &mut TxContext) {
    let member = CoffeeMember { id: object::new(ctx), coffee_club: coffee_club_id };
    transfer::transfer(member, ctx.sender());
}

public fun order_coffee(cafe: &CoffeeCafe, member: &CoffeeMember, ctx: &mut TxContext) {
    // coffeeOrder needs to be a shared object -- it needs to have a cafe id associated with it
    let order = CoffeeOrder { id: object::new(ctx), cafe: object::id(cafe), member: object::id(member), status: OrderStatus::Created };
    event::emit(CoffeeOrderCreated {
        order_id: object::id(&order),
    });
    transfer::share_object(order);
}



#[test]
fun test_module() {
    use sui::test_scenario;

    let admin = @0xAD;
    let manager = @0xCAFE;
    let member = @0xBEEF;

    let mut scenario = test_scenario::begin(admin);
    {
        init(scenario.ctx());
    };

    scenario.next_tx(admin);
    {
        let cap = scenario.take_from_sender<CoffeeClubCap>();
        add_manager(&cap, manager, scenario.ctx());
        scenario.return_to_sender(cap);
    };
    scenario.next_tx(manager);
    {
        let manager_cap = scenario.take_from_sender<CoffeeClubManager>();
        create_cafe(&manager_cap, string::utf8(b"Starbucks"), string::utf8(b"123 Main St"), string::utf8(b"A coffee shop"), scenario.ctx());
        scenario.return_to_sender(manager_cap);
    };
    scenario.next_tx(member);
    {
        let cap = scenario.take_from_address<CoffeeClubCap>(admin);
        create_member(object::id(&cap), scenario.ctx());
        scenario.return_to_address(admin, cap);
    };

    scenario.end();
}
