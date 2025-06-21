"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CoffeeType } from "@/hooks/useOrder";
import { AlertCircle, CheckCircle, Clock, Coffee } from "lucide-react";
import { useState } from "react";

interface CoffeeMenuProps {
  onOrderPlace: (coffee: CoffeeType) => Promise<void>;
  hasPendingOrder: boolean;
}

interface CoffeeItem {
  name: CoffeeType;
  description: string;
  available: boolean;
  icon: string;
  intensity: number;
}

const coffeeItems: CoffeeItem[] = [
  {
    name: "Espresso",
    description: "Rich and bold single shot of espresso",
    available: true,
    icon: "☕",
    intensity: 5,
  },
  {
    name: "Black Coffee",
    description: "Classic drip black coffee",
    available: true,
    icon: "🖤",
    intensity: 2,
  },
  {
    name: "Cappuccino",
    description: "Espresso with steamed milk and foam",
    available: false,
    icon: "🍶",
    intensity: 3,
  },
  {
    name: "Latte",
    description: "Smooth blend of espresso and steamed milk",
    available: false,
    icon: "🥛",
    intensity: 2,
  },
  {
    name: "Macchiato",
    description: "Espresso with a dash of foamed milk",
    available: false,
    icon: "🌙",
    intensity: 4,
  },
  {
    name: "Americano",
    description: "Espresso shots with hot water",
    available: true,
    icon: "🫖",
    intensity: 3,
  },
  {
    name: "Flat White",
    description: "Espresso with velvety steamed milk",
    available: false,
    icon: "🧋",
    intensity: 3,
  },
  {
    name: "Cappuccino Doppio",
    description: "Double espresso with steamed milk and foam",
    available: false,
    icon: "🍶🍶",
    intensity: 5,
  },
  {
    name: "Long",
    description: "Extended espresso extraction",
    available: true,
    icon: "🫗",
    intensity: 4,
  },
  {
    name: "Hot Water",
    description: "Extended espresso extraction",
    available: true,
    icon: "🫗",
    intensity: 4,
  },
];

export function CoffeeMenu({ onOrderPlace, hasPendingOrder }: CoffeeMenuProps) {
  const [orderingItem, setOrderingItem] = useState<CoffeeType | null>(null);

  const handleOrder = async (coffee: CoffeeType) => {
    setOrderingItem(coffee);
    try {
      await onOrderPlace(coffee); // Await the actual transaction
      // If the transaction succeeds, the `orderingItem` will be reset in finally.
      // Any order updates (like adding to `orders` list) will be handled by `page.tsx`
    } catch (error) {
      // Transaction was cancelled or failed
      console.error("Order failed or was cancelled:", error);
      // You might want to show a toast notification here to the user
      // Example: toast.error("Failed to place order. Please try again.");
    } finally {
      setOrderingItem(null); // Reset the loading state regardless of success or failure
    }
  };

  const renderIntensity = (intensity: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i < intensity ? "bg-blue-500" : "bg-blue-200 dark:bg-blue-800"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {coffeeItems
        .sort((a, b) => {
          const isAAvailable = a.available;
          const isBAvailable = b.available;
          if (isAAvailable === isBAvailable) return 0;
          return isAAvailable ? -1 : 1; // Available ones first
        })
        .map((item) => (
          <Card
            key={item.name}
            className={`transition-all duration-300 ${
              item.available
                ? "border-blue-200 dark:border-blue-800 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700 hover:-translate-y-1"
                : "border-gray-200 dark:border-gray-700 opacity-60"
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{item.icon}</div>
                  <div>
                    <CardTitle className="text-blue-800 dark:text-blue-200 text-lg">
                      {item.name}
                    </CardTitle>
                    {item.intensity > 0 && (
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          Intensity:
                        </span>
                        {renderIntensity(item.intensity)}
                      </div>
                    )}
                  </div>
                </div>
                {!item.available ? (
                  <Badge
                    variant="secondary"
                    className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Unavailable
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Available
                  </Badge>
                )}
              </div>
              <CardDescription className="text-blue-600 dark:text-blue-400 mt-2">
                {item.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => handleOrder(item.name)}
                disabled={
                  !item.available ||
                  orderingItem === item.name ||
                  hasPendingOrder
                }
                className={`w-full transition-all duration-200 ${
                  item.available && !hasPendingOrder
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {orderingItem === item.name ? (
                  <>
                    <Coffee className="mr-2 h-4 w-4 animate-pulse" />
                    Creating Order...
                  </>
                ) : hasPendingOrder ? (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Brewing... Please Wait
                  </>
                ) : item.available ? (
                  <>
                    <Coffee className="mr-2 h-4 w-4" />
                    Order Now
                  </>
                ) : (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Currently Unavailable
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
