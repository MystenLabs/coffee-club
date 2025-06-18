module coffee_club::suihub_cafe;

use std::string::String;
use sui::clock::Clock;
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
public struct AdminCap has key, store {
    id: UID,
}

public struct PermissionToOpenCafe has key, store {
    id: UID,
}

public struct CafeOwner has key {
    id: UID,
    owner_address: address,
    cafe_id: ID,
}

public struct CafeManager has key {
    id: UID,
    manager_address: address,
    cafe_id: ID,
}

public struct CoffeeOrder has key {
    id: UID,
    cafe: ID,
    placed_by: address,
    placed_at: u64,
    status: OrderStatus,
    coffee_type: CoffeeType,
}

public struct SuiHubCafe has key, store {
    id: UID,
    owners: vector<address>,
    name: String,
    location: String,
    description: String,
    status: CafeStatus,
    managers: vector<address>,
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

// Error codes
// const ENotCafeManager: u64 = 1;
const ECoffeeNotInMenu: u64 = 1;
const ENotCafeOwnerForAction: u64 = 2;
const ENotCafeManagerForAction: u64 = 3;
const ECafeAlreadyProcessingOrder: u64 = 4;
const EOrderQueueEmpty: u64 = 5;
const ENoOrderCurrentlyProcessing: u64 = 6;
const EWrongOrderForCompletion: u64 = 7;
const ECafeClosed: u64 = 8;

/// === Initialization ===

fun init(ctx: &mut TxContext) {
    transfer::transfer(AdminCap { id: object::new(ctx) }, ctx.sender());
}

/// === Manager Functions ===

public fun create_cafe_owner(_: &AdminCap, owner_address: address, ctx: &mut TxContext) {
    transfer::transfer(
        PermissionToOpenCafe {
            id: object::new(ctx),
        },
        owner_address,
    );
}

// TODO: Not sure if this is needed, but keeping it for now
// public fun delete_manager(manager: CafeManager) {
//     let CafeManager { id } = manager;
//     id.delete();
// }

/// === Cafe Management ===

public fun create_cafe(
    permission: PermissionToOpenCafe,
    name: String,
    location: String,
    description: String,
    ctx: &mut TxContext,
): ID {
    let menu = init_coffee_menu(ctx);

    let cafe = SuiHubCafe {
        id: object::new(ctx),
        owners: vector::singleton(ctx.sender()),
        name,
        location,
        description,
        status: CafeStatus::Closed,
        managers: vector<address>[],
        menu,
        order_queue: vector<ID>[],
        currently_processing: option::none<ID>(),
    };
    let cafe_id = object::id(&cafe);
    event::emit(CafeCreated {
        cafe_id,
        creator: ctx.sender(),
    });
    let PermissionToOpenCafe { id } = permission;
    id.delete();
    transfer::transfer(
        CafeOwner { id: object::new(ctx), owner_address: ctx.sender(), cafe_id },
        ctx.sender(),
    );
    transfer::share_object(cafe);
    cafe_id
}

public fun set_cafe_status_by_onwer(
    cafe: &mut SuiHubCafe,
    new_status: CafeStatus,
    owner: &CafeOwner,
) {
    assert!(is_owner(cafe, owner), ENotCafeOwnerForAction);
    cafe.status = new_status;
}

public fun set_cafe_status_by_manager(
    cafe: &mut SuiHubCafe,
    new_status: CafeStatus,
    manager: &CafeManager,
) {
    assert!(is_manager(cafe, manager), ENotCafeManagerForAction);
    cafe.status = new_status;
}

// === Menu Management ===

// public fun add_coffee_type_to_menu(
//     cafe: &mut SuiHubCafe,
//     coffee: CoffeeType,
//     manager: &CafeManager,
// ) {
//     assert!(is_manager(cafe, manager), ENotCafeManagerForAction);
//     cafe.menu.insert(coffee, true);
//     // table::insert(&mut cafe.menu, coffee, true);
// }

public fun remove_coffee_type_from_menu(
    cafe: &mut SuiHubCafe,
    coffee: CoffeeType,
    manager: &CafeManager,
) {
    assert!(is_manager(cafe, manager), ENotCafeManagerForAction);
    cafe.menu.remove(coffee);
}

/// === Order Functions ===

public fun order_coffee(
    cafe: &mut SuiHubCafe,
    coffee_type: CoffeeType,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let available = cafe.menu.borrow(coffee_type);
    assert!(available == true, ECoffeeNotInMenu);

    let order = CoffeeOrder {
        id: object::new(ctx),
        cafe: object::id(cafe),
        placed_by: ctx.sender(),
        placed_at: clock.timestamp_ms(),
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
// public fun process_next_order(cafe: &mut SuiHubCafe, manager: &CafeManager) {
public fun process_next_order(cafe: &mut SuiHubCafe) {
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
// public fun complete_current_order(cafe: &mut SuiHubCafe, order: &mut CoffeeOrder, manager: &CafeManager) {
public fun complete_current_order(cafe: &mut SuiHubCafe, order: &mut CoffeeOrder) {
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
// public fun update_coffee_order(
//     cafe: &mut SuiHubCafe,
//     order: &mut CoffeeOrder,
//     new_status: OrderStatus,
//     manager: &CafeManager,
// ) {
//     assert!(is_manager(cafe, manager), ENotCafeManagerForAction);
//     assert!(object::id(cafe) == order.cafe, ENotCafeManager);

//     order.status = new_status;

//     event::emit(CoffeeOrderUpdated {
//         order_id: object::id(order),
//         status: new_status,
//     });
// }

/// === Manager Control ===

public fun add_manager_to_cafe(
    cafe: &mut SuiHubCafe,
    owner: &CafeOwner,
    new_manager: address,
    ctx: &mut TxContext,
) {
    assert!(is_owner(cafe, owner), ENotCafeOwnerForAction);
    cafe.managers.push_back(new_manager);
    transfer::transfer(
        CafeManager {
            id: object::new(ctx),
            manager_address: new_manager,
            cafe_id: object::id(cafe),
        },
        new_manager,
    );
}

public fun remove_manager_from_cafe(
    owner: &CafeOwner,
    cafe: &mut SuiHubCafe,
    manager_address: address,
) {
    assert!(is_owner(cafe, owner), ENotCafeOwnerForAction);
    let (found, index) = cafe.managers.index_of(&manager_address);
    if (found) { cafe.managers.remove(index); };
}

/// === Helpers ===

fun is_owner(cafe: &SuiHubCafe, cafeOwner: &CafeOwner): bool {
    cafe.owners.contains(&cafeOwner.owner_address)
}

fun is_manager(cafe: &SuiHubCafe, cafeManager: &CafeManager): bool {
    cafe.managers.contains(&cafeManager.manager_address)
}

fun is_cafe_open(cafe: &SuiHubCafe): bool {
    match (&cafe.status) {
        CafeStatus::Open => true,
        CafeStatus::Closed => false,
    }
}

fun init_coffee_menu(ctx: &mut TxContext): Table<CoffeeType, bool> {
    let mut menu = table::new<CoffeeType, bool>(ctx);

    menu.add(CoffeeType::Espresso, true);
    menu.add(CoffeeType::Americano, true);
    menu.add(CoffeeType::Doppio, true);
    menu.add(CoffeeType::Long, true);
    menu.add(CoffeeType::HotWater, true);
    menu.add(CoffeeType::Coffee, true);

    menu
}

/// === Enums Helpers ===

public fun espresso(): CoffeeType { CoffeeType::Espresso }

public fun americano(): CoffeeType { CoffeeType::Americano }

public fun doppio(): CoffeeType { CoffeeType::Doppio }

public fun long(): CoffeeType { CoffeeType::Long }

public fun hotwater(): CoffeeType { CoffeeType::HotWater }

public fun coffee(): CoffeeType { CoffeeType::Coffee }

// public fun created(): OrderStatus { OrderStatus::Created }
// public fun processing(): OrderStatus { OrderStatus::Processing }
// public fun completed(): OrderStatus { OrderStatus::Completed }
// public fun cancelled(): OrderStatus { OrderStatus::Cancelled }

// public fun test(ctx: &mut TxContext) {
//     event::emit(CafeCreated {
//         cafe_id: object::id_from_address(ctx.sender()),
//         creator: ctx.sender(),
//     });
// }

// public struct TestCoffeeOrder has key {
//     id: UID,
//     placed_by: address,
//     placed_at: u64,
//     status: OrderStatus,
//     coffee_type: CoffeeType,
// }

// public fun test_order_coffee(coffee_type: CoffeeType, clock: &Clock, ctx: &mut TxContext) {
//     let order = TestCoffeeOrder {
//         id: object::new(ctx),
//         placed_by: ctx.sender(),
//         placed_at: clock.timestamp_ms(),
//         status: OrderStatus::Created,
//         coffee_type,
//     };
//     let order_id = object::id(&order);
//     event::emit(CoffeeOrderCreated { order_id });
//     transfer::share_object(order);
// }
