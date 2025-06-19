module coffee_club::coffee_club;

use std::string::String;
use sui::event;

public enum OrderStatus has copy, drop, store {
    Created,
    Processing,
    Completed,
    Cancelled,
}

public enum CoffeeType has copy, drop, store {
    Espresso,
    Americano,
    Doppio,
    Long,
    HotWater,
    Coffee,
}

public enum CafeStatus has drop, store {
    Open,
    Closed,
}

public struct CoffeeClubCap has key, store {
    id: UID,
}

public struct CoffeeClubManager has key, store {
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
    coffee_type: CoffeeType,
    created_at: u64,
    updated_at: u64,
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

public struct CoffeeOrderUpdated has copy, drop {
    order_id: ID,
    status: OrderStatus,
}

const ENotCoffeeClubAdmin: u64 = 0;
const ENotCafeManager: u64 = 1;

// == Functions ==

fun init(ctx: &mut TxContext) {
    transfer::transfer(CoffeeClubCap { id: object::new(ctx) }, ctx.sender());
}

/// Adds a manager to the Coffee Club. Only the CoffeeClubCap holder can call this.
public fun add_manager(coffee_club: &CoffeeClubCap, recipient: address, ctx: &mut TxContext) {
    let manager = CoffeeClubManager { id: object::new(ctx), coffee_club: object::id(coffee_club) };
    transfer::transfer(manager, recipient);
}

/// Deletes a manager from the Coffee Club.  Only the CoffeeClubCap holder can call this.
public fun delete_manager(coffee_club: &CoffeeClubCap, manager: CoffeeClubManager) {
    // check if manager coffee_club id matches coffeeclubcap id
    assert!(object::id(coffee_club) == manager.coffee_club, ENotCoffeeClubAdmin);
    let CoffeeClubManager { id, coffee_club: _ } = manager;
    object::delete(id);
}

/// Creates a new cafe managed by the given CoffeeClubManager. The manager's ID is stored within.
#[allow(lint(self_transfer))]
public fun create_cafe(
    manager: &CoffeeClubManager,
    name: String,
    location: String,
    description: String,
    ctx: &mut TxContext,
): ID {
    let cafe = CoffeeCafe {
        id: object::new(ctx),
        manager: object::id(manager),
        name,
        location,
        description,
        status: CafeStatus::Closed,
    };
    let cafe_id = object::id(&cafe);
    event::emit(CafeCreated {
        cafe_id,
        creator: ctx.sender(),
    });

    transfer::transfer(cafe, ctx.sender());
    cafe_id
}

/// Creates a new coffee club member.
#[allow(lint(self_transfer))]
public fun create_member(coffee_club_id: ID, ctx: &mut TxContext) {
    let member = CoffeeMember { id: object::new(ctx), coffee_club: coffee_club_id };
    transfer::transfer(member, ctx.sender());
}

/// Deletes a coffee club member. Only the CoffeeClubCap holder can call this.
public fun delete_member(coffee_club: &CoffeeClubCap, member: CoffeeMember) {
    // check if member coffee_club id matches coffeeclubcap id
    assert!(object::id(coffee_club) == member.coffee_club, ENotCoffeeClubAdmin);
    let CoffeeMember { id, coffee_club: _ } = member;
    object::delete(id);
}

/// Allows a member to place a coffee order at a specific cafe. Creates a shared CoffeeOrder object.
public fun order_coffee(member: &CoffeeMember, cafe_id: ID, coffee_type: CoffeeType, ctx: &mut TxContext) {
    let now = tx_context::epoch_timestamp_ms(ctx);
    let order = CoffeeOrder {
        id: object::new(ctx),
        cafe: cafe_id,
        member: object::id(member),
        status: OrderStatus::Created,
        coffee_type: coffee_type,
        created_at: now,
        updated_at: now,
    };
    event::emit(CoffeeOrderCreated {
        order_id: object::id(&order),
    });
    transfer::share_object(order);
}

/// Allows a cafe manager to update the status of a coffee order.
public fun update_coffee_order(
    cafe: &CoffeeCafe,
    order: &mut CoffeeOrder,
    order_status: OrderStatus,
    ctx: &mut TxContext,
) {
    // check if cafe id matches order cafe id
    assert!(object::id(cafe) == order.cafe, ENotCafeManager);
    order.status = order_status;
    order.updated_at = tx_context::epoch_timestamp_ms(ctx);
    event::emit(CoffeeOrderUpdated {
        order_id: object::id(order),
        status: order.status,
    });
}

/// Allows a cafe manager to set the cafe status (Open/Closed).
public fun set_cafe_status(
    cafe: &mut CoffeeCafe,
    new_status: CafeStatus,
    manager: &CoffeeClubManager,
) {
    assert!(object::id(manager) == cafe.manager, ENotCafeManager); // Only cafe manager can change status
    cafe.status = new_status;
}

// Helper functions to create OrderStatus enum values
public fun created(): OrderStatus { OrderStatus::Created }

public fun processing(): OrderStatus { OrderStatus::Processing }

public fun completed(): OrderStatus { OrderStatus::Completed }

public fun cancelled(): OrderStatus { OrderStatus::Cancelled }

public fun espresso(): CoffeeType { CoffeeType::Espresso }

public fun americano(): CoffeeType { CoffeeType::Americano }

public fun doppio(): CoffeeType { CoffeeType::Doppio }

public fun long(): CoffeeType { CoffeeType::Long }

public fun hotwater(): CoffeeType { CoffeeType::HotWater }

// Add the missing helper function for Coffee
public fun coffee(): CoffeeType { CoffeeType::Coffee }

#[test_only]
const ADMIN: address = @0xAD;
#[test_only]
const MANAGER: address = @0xCAFE;
#[test_only]
const MEMBER: address = @0xBEEF;

#[test]
fun test_module() {
    use sui::test_scenario;

    let mut scenario = test_scenario::begin(ADMIN);
    {
        init(scenario.ctx());
    };

    scenario.next_tx(ADMIN);
    {
        let cap = scenario.take_from_sender<CoffeeClubCap>();
        add_manager(&cap, MANAGER, scenario.ctx());
        scenario.return_to_sender(cap);
    };

    // Create a cafe
    scenario.next_tx(MANAGER);
    {
        let manager_cap = scenario.take_from_sender<CoffeeClubManager>();
        create_cafe(
            &manager_cap,
            b"Starbucks".to_string(),
            b"123 Main St".to_string(),
            b"A coffee shop".to_string(),
            scenario.ctx(),
        );
        scenario.return_to_sender(manager_cap);
    };

    // Create a member
    scenario.next_tx(MEMBER);
    {
        let cap = scenario.take_from_address<CoffeeClubCap>(ADMIN);
        create_member(object::id(&cap), scenario.ctx());
        test_scenario::return_to_address(ADMIN, cap);
    };

    // Member places an order
    scenario.next_tx(MEMBER);
    {
        let cafe = scenario.take_from_address<CoffeeCafe>(MANAGER);
        let member = scenario.take_from_sender<CoffeeMember>();
        let coffee_type = espresso();
        order_coffee(&member, object::id(&cafe), coffee_type, scenario.ctx());
        test_scenario::return_to_address(MANAGER, cafe);
        scenario.return_to_sender(member);
    };

    // Manager updates cafe status
    scenario.next_tx(MANAGER);
    {
        let manager_cap = scenario.take_from_sender<CoffeeClubManager>();
        let mut cafe = scenario.take_from_sender<CoffeeCafe>();
        set_cafe_status(&mut cafe, CafeStatus::Open, &manager_cap);
        scenario.return_to_sender(cafe);
        scenario.return_to_sender(manager_cap);
    };

    // Manager updates order status
    scenario.next_tx(MANAGER);
    {
        let mut order = test_scenario::take_shared<CoffeeOrder>(&scenario);
        let cafe = scenario.take_from_sender<CoffeeCafe>();
        let manager_cap = scenario.take_from_sender<CoffeeClubManager>();
        update_coffee_order(&cafe, &mut order, OrderStatus::Processing, scenario.ctx());
        test_scenario::return_shared(order);
        scenario.return_to_sender(cafe);
        scenario.return_to_sender(manager_cap);
    };

    // Test: Deleting a member
    scenario.next_tx(ADMIN);
    {
        let cap = scenario.take_from_sender<CoffeeClubCap>();
        let member = scenario.take_from_address<CoffeeMember>(MEMBER);
        delete_member(&cap, member);
        scenario.return_to_sender(cap);
    };

    // Test: Deleting a manager
    scenario.next_tx(ADMIN);
    {
        let cap = scenario.take_from_sender<CoffeeClubCap>();
        let manager = scenario.take_from_address<CoffeeClubManager>(MANAGER);
        delete_manager(&cap, manager);
        scenario.return_to_sender(cap);
    };

    scenario.end();
}
