module coffee_club::suihub_cafe;

use std::string::String;
use sui::clock::Clock;
use sui::event;
use sui::package;
use sui::table::{Self, Table};

/// Enums
public enum OrderStatus has copy, drop, store {
    Created,
    Processing,
    Completed,
    Cancelled, // Not sure if we need this
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
    orders: Table<ID, OrderStatus>,
    // finalized_orders: vector<ID>,
}

public struct SuiHubCoffee has key {
    id: UID,
    cafe_id: ID,
    coffee_type: CoffeeType,
    placed_at: u64,
}

/// One Time Witness to create the `Publisher`.
public struct SUIHUB_CAFE has drop {}

// == Events ==

public struct CafeCreated has copy, drop {
    cafe_id: ID,
    creator: address,
}

public struct CoffeeOrderCreated has copy, drop {
    order_id: ID,
    coffee_type: CoffeeType,
}

public struct CoffeeOrderUpdated has copy, drop {
    order_id: ID,
    status: OrderStatus,
}

// Error codes
const ECoffeeNotInMenu: u64 = 1;
const ENotCafeOwnerForAction: u64 = 2;
const ENotCafeManagerForAction: u64 = 3;
const EWrongOrderToProcess: u64 = 4;
const ECafeClosed: u64 = 5;

/// === Initialization ===

fun init(otw: SUIHUB_CAFE, ctx: &mut TxContext) {
    package::claim_and_keep(otw, ctx);
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
        orders: table::new<ID, OrderStatus>(ctx),
        // finalized_orders: vector<ID>[],
    };
    let cafe_id = object::id(&cafe);

    let PermissionToOpenCafe { id } = permission;
    id.delete();
    transfer::transfer(
        CafeOwner { id: object::new(ctx), owner_address: ctx.sender(), cafe_id },
        ctx.sender(),
    );
    transfer::share_object(cafe);
    event::emit(CafeCreated {
        cafe_id,
        creator: ctx.sender(),
    });
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

fun toggle_cafe_status(cafe: &mut SuiHubCafe) {
    if (is_cafe_open(cafe)) {
        cafe.status = CafeStatus::Closed;
    } else {
        cafe.status = CafeStatus::Open;
    }
}

public fun toggle_cafe_status_by_onwer(cafe: &mut SuiHubCafe, owner: &CafeOwner) {
    assert!(is_owner(cafe, owner), ENotCafeOwnerForAction);
    toggle_cafe_status(cafe);
}

public fun toggle_cafe_status_by_manager(cafe: &mut SuiHubCafe, manager: &CafeManager) {
    assert!(is_manager(cafe, manager), ENotCafeManagerForAction);
    toggle_cafe_status(cafe);
}

// === Menu Management ===

public fun add_coffee_type_to_menu(
    cafe: &mut SuiHubCafe,
    coffee: CoffeeType,
    manager: &CafeManager,
) {
    assert!(is_manager(cafe, manager), ENotCafeManagerForAction);
    cafe.menu.add(coffee, true);
}

public fun remove_coffee_type_from_menu(
    cafe: &mut SuiHubCafe,
    coffee: CoffeeType,
    manager: &CafeManager,
) {
    assert!(is_manager(cafe, manager), ENotCafeManagerForAction);
    cafe.menu.remove(coffee);
}

public fun enable_coffee_type_to_menu(
    cafe: &mut SuiHubCafe,
    coffee: CoffeeType,
    manager: &CafeManager,
) {
    assert!(is_manager(cafe, manager), ENotCafeManagerForAction);
    *cafe.menu.borrow_mut(coffee) = true;
}

public fun disable_coffee_type_from_menu(
    cafe: &mut SuiHubCafe,
    coffee: CoffeeType,
    manager: &CafeManager,
) {
    assert!(is_manager(cafe, manager), ENotCafeManagerForAction);
    *cafe.menu.borrow_mut(coffee) = false;
}

/// === Order Functions ===

public fun order_coffee(
    cafe: &mut SuiHubCafe,
    coffee_type: CoffeeType,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(is_cafe_open(cafe), ECafeClosed);

    let available = cafe.menu.borrow(coffee_type);
    assert!(available == true, ECoffeeNotInMenu);

    let order = CoffeeOrder {
        id: object::new(ctx),
        placed_by: ctx.sender(),
        placed_at: clock.timestamp_ms(),
        status: OrderStatus::Created,
        coffee_type,
    };
    let order_id = object::id(&order);

    cafe.orders.add(order_id, OrderStatus::Created);
    event::emit(CoffeeOrderCreated {
        order_id: object::id(&order),
        coffee_type,
    });
    transfer::share_object(order);
}

// === Order Status ===

public fun process_order(
    cafeManager: &CafeManager,
    cafe: &mut SuiHubCafe,
    order: &mut CoffeeOrder,
) {
    assert!(is_manager(cafe, cafeManager), ENotCafeManagerForAction);
    assert!(is_cafe_open(cafe), ECafeClosed);
    assert!(is_order_created(order), EWrongOrderToProcess);

    let order_id = object::id(order);

    order.status = OrderStatus::Processing;
    *cafe.orders.borrow_mut(order_id) = OrderStatus::Processing;

    event::emit(CoffeeOrderUpdated {
        order_id: object::id(order),
        status: OrderStatus::Processing,
    });
}

public fun complete_order(
    cafeManager: &CafeManager,
    cafe: &mut SuiHubCafe,
    order: &mut CoffeeOrder,
    ctx: &mut TxContext,
) {
    assert!(is_manager(cafe, cafeManager), ENotCafeManagerForAction);
    assert!(is_cafe_open(cafe), ECafeClosed);
    assert!(is_order_processing(order), EWrongOrderToProcess);

    let order_id = object::id(order);

    order.status = OrderStatus::Completed;
    *cafe.orders.borrow_mut(order_id) = OrderStatus::Completed;

    event::emit(CoffeeOrderUpdated {
        order_id: object::id(order),
        status: OrderStatus::Completed,
    });

    transfer::transfer(
        SuiHubCoffee {
            id: object::new(ctx),
            cafe_id: object::id(cafe),
            coffee_type: order.coffee_type,
            placed_at: order.placed_at,
        },
        order.placed_by,
    );
}

/// === Owner Control ===

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

public fun delete_completed_order(
    cafeManager: &CafeManager,
    cafe: &mut SuiHubCafe,
    order: CoffeeOrder,
) {
    assert!(is_manager(cafe, cafeManager), ENotCafeManagerForAction);
    assert!(is_order_completed(&order), EWrongOrderToProcess);

    let order_id = object::id(&order);
    cafe.orders.remove(order_id);

    let CoffeeOrder {
        id,
        placed_by: _,
        placed_at: _,
        status: _,
        coffee_type: _,
    } = order;
    id.delete();
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

fun is_order_created(order: &CoffeeOrder): bool {
    match (&order.status) {
        OrderStatus::Created => true,
        OrderStatus::Processing => false,
        OrderStatus::Completed => false,
        OrderStatus::Cancelled => false,
    }
}

fun is_order_processing(order: &CoffeeOrder): bool {
    match (&order.status) {
        OrderStatus::Created => false,
        OrderStatus::Processing => true,
        OrderStatus::Completed => false,
        OrderStatus::Cancelled => false,
    }
}

fun is_order_completed(order: &CoffeeOrder): bool {
    match (&order.status) {
        OrderStatus::Created => false,
        OrderStatus::Processing => false,
        OrderStatus::Completed => true,
        OrderStatus::Cancelled => false,
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

// === Enums Helpers ===

// Coffee Types
public fun espresso(): CoffeeType { CoffeeType::Espresso }

public fun americano(): CoffeeType { CoffeeType::Americano }

public fun doppio(): CoffeeType { CoffeeType::Doppio }

public fun long(): CoffeeType { CoffeeType::Long }

public fun hotwater(): CoffeeType { CoffeeType::HotWater }

public fun coffee(): CoffeeType { CoffeeType::Coffee }

// Cafe Status
public fun open(): CafeStatus { CafeStatus::Open }

public fun closed(): CafeStatus { CafeStatus::Closed }
