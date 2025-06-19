import { getAllOrders } from "./getAllOrders";

async function process() {
  const { orders, error } = await getAllOrders();
  if (error) {
    console.error("Error fetching orders:", error);
    return;
  }
  console.log("Orders:", orders);
}

process()
  .then(() => console.log("Order processing completed."))
  .catch((err) => console.error("Error during order processing:", err));