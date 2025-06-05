/// Module: cafe
module suihub_cafe::cafe;

// ======== Enums ========
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
public struct AdminCap has key {
    id: UID,
    cafe_id: ID,
}

public struct CoffeeOption has copy, drop, store {
    name: vector<u8>,
}

public struct Order has key, store {
    id: UID,
    customer: address,
    coffee: CoffeeOption,
    status: OrderStatus,
}

public struct Cafe has key {
    id: UID,
    name: vector<u8>,
    admin: address,
    status: CafeStatus,
    menu: vector<CoffeeOption>,
    orders: vector<Order>,
}

// ======== Error Codes ========
const ENotCafeManager: u64 = 1; // Only the assigned cafe manager can perform this action
const ECafeClosed: u64 = 2; // Cannot place order when cafe is closed
// const ENontCoffeeGlovalAdmin: u64 = 0; // Only CoffeeClubCap can perform this action
// const ECoffeeTypeNotAvailable: u64 = 3; // Requested coffee type is not on the menu
// const ECoffeeTypeAlreadyExists: u64 = 4; // Attempted to add an already existing coffee type
// const ECoffeeTypeNotFound: u64 = 5; // Attempted to remove a non-existent coffee type

public fun create_cafe(name: vector<u8>, admin: address, ctx: &mut TxContext): (AdminCap, Cafe) {
    let cafe = Cafe {
        id: object::new(ctx),
        name,
        admin,
        status: CafeStatus::Open,
        menu: vector::empty<CoffeeOption>(),
        orders: vector::empty<Order>(),
    };
    let admin_cap = AdminCap { id: object::new(ctx), cafe_id: object::id(&cafe) };
    (admin_cap, cafe)
}

public fun open(admin_cap: &AdminCap, self: &mut Cafe) {
    assert!(object::id(self) == admin_cap.cafe_id, ENotCafeManager);
    self.status = CafeStatus::Open;
}

public fun close(admin_cap: &AdminCap, self: &mut Cafe) {
    assert!(object::id(self) == admin_cap.cafe_id, ENotCafeManager);
    self.status = CafeStatus::Closed;
}

public fun toggle_status(admin_cap: &AdminCap, self: &mut Cafe) {
    assert!(object::id(self) == admin_cap.cafe_id, ENotCafeManager);
    match (&self.status) {
        CafeStatus::Open => self.status = CafeStatus::Closed,
        CafeStatus::Closed => self.status = CafeStatus::Open,
    };
}

public fun add_coffee_option(admin_cap: &AdminCap, self: &mut Cafe, name: vector<u8>) {
    assert!(object::id(self) == admin_cap.cafe_id, ENotCafeManager);
    let option = CoffeeOption { name };
    self.menu.push_back(option);
}

public fun remove_coffee_option(admin_cap: &AdminCap, self: &mut Cafe, index: u64) {
    assert!(object::id(self) == admin_cap.cafe_id, ENotCafeManager);
    self.menu.remove(index);
}

public fun place_order(self: &mut Cafe, coffee_index: u64, ctx: &mut TxContext) {
    assert!(is_cafe_open(self), ECafeClosed);

    let coffee = vector::borrow(&self.menu, coffee_index);
    let coffee_copy = *coffee;

    let order = Order {
        id: object::new(ctx),
        customer: ctx.sender(),
        coffee: coffee_copy,
        status: OrderStatus::Created,
    };

    self.orders.push_back(order);
}

// public fun update_order_status(admin_cap: &AdminCap, cafe: &mut Cafe, order_index: u64, new_status: u8) {
//     assert!(caller == cafe.admin, 5);
//     let order = vector::borrow_mut(&mut cafe.orders, order_index);
//     order.status = new_status;
// }

public fun get_orders(cafe: &Cafe): &vector<Order> {
    &cafe.orders
}

fun is_cafe_open(self: &Cafe): bool {
    match (&self.status) {
        CafeStatus::Open => true,
        CafeStatus::Closed => false,
    }
}
