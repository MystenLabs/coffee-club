module suihub_cafe::suihub_cafe;

use std::string::String;
use sui::event;
use sui::table::{Self, Table};

/// Enums
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

/// Core Types
public struct CoffeeClubCap has key, store {
    id: UID,
}

public struct CoffeeClubManager has key, store {
    id: UID,
    coffee_club: ID,
}

public struct CoffeeOrder has key {
    id: UID,
    cafe: ID,
    placed_by: address,
    status: OrderStatus,
    coffee_type: CoffeeType,
}

public struct CoffeeCafe has key, store {
    id: UID,
    coffee_club: ID,
    name: String,
    location: String,
    description: String,
    status: CafeStatus,
    managers: vector<ID>,
    menu: Table<CoffeeType, bool>,
    order_queue: vector<ID>,
    currently_processing: Option<ID>,
}

/// Events
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

public struct CoffeeOrderProcessing has copy, drop {
    cafe_id: ID,
    order_id: ID,
}

/// Error codes
const ENotCoffeeClubAdmin: u64 = 0;
const ENotCafeManager: u64 = 1;
const ECoffeeNotInMenu: u64 = 2;
const ENotCafeManagerForAction: u64 = 3;
const ECafeAlreadyProcessingOrder: u64 = 4;
const EOrderQueueEmpty: u64 = 5;
const ENoOrderCurrentlyProcessing: u64 = 6;
const EWrongOrderForCompletion: u64 = 7;
const ECafeClosed: u64 = 8;

/// === Initialization ===

fun init(ctx: &mut TxContext) {
    transfer::transfer(CoffeeClubCap { id: object::new(ctx) }, ctx.sender());
}

/// === Manager Functions ===

public fun add_manager(coffee_club: &CoffeeClubCap, recipient: address, ctx: &mut TxContext) {
    let manager = CoffeeClubManager {
        id: object::new(ctx),
        coffee_club: object::id(coffee_club),
    };
    transfer::transfer(manager, recipient);
}

public fun delete_manager(coffee_club: &CoffeeClubCap, manager: CoffeeClubManager) {
    assert!(object::id(coffee_club) == manager.coffee_club, ENotCoffeeClubAdmin);
    let CoffeeClubManager { id, coffee_club: _ } = manager;
    object::delete(id);
}

/// === Cafe Management ===

#[allow(lint(self_transfer))]
public fun create_cafe(
    manager: &CoffeeClubManager,
    name: String,
    location: String,
    description: String,
    ctx: &mut TxContext,
): ID {
    let menu = table::new<CoffeeType, bool>(ctx);
    let cafe = CoffeeCafe {
        id: object::new(ctx),
        coffee_club: manager.coffee_club,
        name,
        location,
        description,
        status: CafeStatus::Closed,
        managers: vector::singleton(object::id(manager)),
        menu,
        order_queue: vector<ID>[],
        currently_processing: option::none<ID>(),
    };
    let cafe_id = object::id(&cafe);
    event::emit(CafeCreated {
        cafe_id,
        creator: ctx.sender(),
    });
    transfer::transfer(cafe, ctx.sender());
    cafe_id
}

public fun set_cafe_status(
    cafe: &mut CoffeeCafe,
    new_status: CafeStatus,
    manager: &CoffeeClubManager,
) {
    assert!(is_manager(cafe, manager), ENotCafeManagerForAction);
    cafe.status = new_status;
}

// === Menu Management ===

// public fun add_coffee_type_to_menu(
//     cafe: &mut CoffeeCafe,
//     coffee: CoffeeType,
//     manager: &CoffeeClubManager,
// ) {
//     assert!(is_manager(cafe, manager), ENotCafeManagerForAction);
//     cafe.menu.insert(coffee, true);
//     // table::insert(&mut cafe.menu, coffee, true);
// }

public fun remove_coffee_type_from_menu(
    cafe: &mut CoffeeCafe,
    coffee: CoffeeType,
    manager: &CoffeeClubManager,
) {
    assert!(is_manager(cafe, manager), ENotCafeManagerForAction);
    cafe.menu.remove(coffee);
}

/// === Order Functions ===

public fun order_coffee(cafe: &mut CoffeeCafe, coffee_type: CoffeeType, ctx: &mut TxContext) {
    let available = cafe.menu.borrow(coffee_type);
    assert!(available == true, ECoffeeNotInMenu);

    let order = CoffeeOrder {
        id: object::new(ctx),
        cafe: object::id(cafe),
        placed_by: ctx.sender(),
        status: OrderStatus::Created,
        coffee_type,
    };
    let order_id = object::id(&order);
    event::emit(CoffeeOrderCreated { order_id });
    cafe.order_queue.push_back(order_id);
    transfer::share_object(order);
}

// === Order Status ===

// Takes the next order from the queue and assigns it to 'currently_processing'.
// This function only updates the Cafe's state. The caller must then separately
// call `update_coffee_order` with the actual CoffeeOrder object to change its status.
// public fun process_next_order(cafe: &mut CoffeeCafe, manager: &CoffeeClubManager) {
public fun process_next_order(cafe: &mut CoffeeCafe) {
    // assert!(is_manager(cafe, manager), ENotCafeManagerForAction);
    assert!(cafe.currently_processing.is_none(), ECafeAlreadyProcessingOrder);
    assert!(!cafe.order_queue.is_empty(), EOrderQueueEmpty);
    assert!(is_cafe_open(cafe), ECafeClosed);

    // Get the next order from the front of the queue
    let order_id = vector::remove(&mut cafe.order_queue, 0);
    cafe.currently_processing = option::some(order_id);

    event::emit(CoffeeOrderProcessing {
        cafe_id: object::id(cafe),
        order_id,
    });
}

// Completes the currently processing order, updating its status and clearing the slot.
// This function requires both the cafe and the specific order object to ensure consistency.
// public fun complete_current_order(cafe: &mut CoffeeCafe, order: &mut CoffeeOrder, manager: &CoffeeClubManager) {
public fun complete_current_order(cafe: &mut CoffeeCafe, order: &mut CoffeeOrder) {
    // assert!(object::id(cafe) == order.cafe, ENotCafeManager); // Ensure order belongs to cafe
    assert!(option::is_some(&cafe.currently_processing), ENoOrderCurrentlyProcessing);
    assert!(is_cafe_open(cafe), ECafeClosed);

    let order_id = object::id(order);
    // Ensure the order being completed is the one the cafe is currently processing.
    assert!(option::contains(&cafe.currently_processing, &order_id), EWrongOrderForCompletion);

    // Clear the currently processing slot
    cafe.currently_processing = option::none<ID>();

    // Update the order's status to Completed
    order.status = OrderStatus::Completed;

    event::emit(CoffeeOrderUpdated {
        order_id: object::id(order),
        status: OrderStatus::Completed,
    });
}

// TODO: remove this function
public fun update_coffee_order(
    cafe: &mut CoffeeCafe,
    order: &mut CoffeeOrder,
    new_status: OrderStatus,
    manager: &CoffeeClubManager,
) {
    assert!(is_manager(cafe, manager), ENotCafeManagerForAction);
    assert!(object::id(cafe) == order.cafe, ENotCafeManager);

    order.status = new_status;

    event::emit(CoffeeOrderUpdated {
        order_id: object::id(order),
        status: new_status,
    });
}

/// === Manager Control ===

public fun add_manager_to_cafe(
    cafe: &mut CoffeeCafe,
    manager: &CoffeeClubManager,
    caller: &CoffeeClubManager,
) {
    assert!(object::id(caller) == cafe.managers[0], ENotCoffeeClubAdmin); // Only creator can add more
    cafe.managers.push_back(object::id(manager));
}

// public fun remove_manager_from_cafe(
//     cafe: &mut CoffeeCafe,
//     manager_id: ID,
//     caller: &CoffeeClubManager,
// ) {
//     assert!(object::id(caller) == cafe.managers[0], ENotCoffeeClubAdmin); // Only creator can remove
//     cafe.managers = vec::filter(cafe.managers, fun (id: &ID): bool {
//         *id != manager_id
//     });
// }

/// === Helpers ===

fun is_manager(cafe: &CoffeeCafe, manager: &CoffeeClubManager): bool {
    cafe.managers.contains(&object::id(manager))
}

fun is_cafe_open(cafe: &CoffeeCafe): bool {
    match (&cafe.status) {
        CafeStatus::Open => true,
        CafeStatus::Closed => false,
    }
}

// /// === Enums Helpers ===
// public fun created(): OrderStatus { OrderStatus::Created }
// public fun processing(): OrderStatus { OrderStatus::Processing }
// public fun completed(): OrderStatus { OrderStatus::Completed }
// public fun cancelled(): OrderStatus { OrderStatus::Cancelled }

// public fun espresso(): CoffeeType { CoffeeType::Espresso }
// public fun americano(): CoffeeType { CoffeeType::Americano }
// public fun doppio(): CoffeeType { CoffeeType::Doppio }
// public fun long(): CoffeeType { CoffeeType::Long }
// public fun hotwater(): CoffeeType { CoffeeType::HotWater }
// public fun coffee(): CoffeeType { CoffeeType::Coffee }
