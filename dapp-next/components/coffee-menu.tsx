"use client";

import type { CoffeeType } from "@/app/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle, Clock, Coffee } from "lucide-react";
import { useState } from "react";

interface CoffeeMenuProps {
  onOrderPlace: (coffee: CoffeeType) => void;
}

interface CoffeeItem {
  name: CoffeeType;
  description: string;
  available: boolean;
  icon: string;
  intensity: number;
}

// {
//   id: "1",
//   name: "Classic Espresso",
//   description: "Rich, bold espresso with a perfect crema. The foundation of all great coffee drinks.",
//   strength: 5,
//   prepTime: "2-3 min",
//   type: "Hot",
//   image: "☕"
// },
// {
//   id: "2",
//   name: "Smooth Americano",
//   description: "Espresso with hot water for a clean, pure coffee taste that's never bitter.",
//   strength: 3,
//   prepTime: "3-4 min",
//   type: "Hot",
//   image: "☕"
// },
// {
//   id: "3",
//   name: "Creamy Latte",
//   description: "Espresso with steamed milk and a light layer of foam. Perfectly balanced and smooth.",
//   strength: 2,
//   prepTime: "4-5 min",
//   type: "Hot",
//   image: "🥛"
// },
// {
//   id: "4",
//   name: "Frothy Cappuccino",
//   description: "Equal parts espresso, steamed milk, and milk foam. A classic Italian favorite.",
//   strength: 3,
//   prepTime: "4-5 min",
//   type: "Hot",
//   image: "☕"
// },
// {
//   id: "5",
//   name: "Iced Cold Brew",
//   description: "Slow-steeped coffee concentrate served over ice. Smooth and refreshing.",
//   strength: 4,
//   prepTime: "1-2 min",
//   type: "Cold",
//   image: "🧊"
// },
// {
//   id: "6",
//   name: "Vanilla Macchiato",
//   description: "Espresso with vanilla syrup, steamed milk, and a caramel drizzle on top.",
//   strength: 2,
//   prepTime: "5-6 min",
//   type: "Hot",
//   image: "🍦"
// }

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
];

export function CoffeeMenu({ onOrderPlace }: CoffeeMenuProps) {
  const [orderingItem, setOrderingItem] = useState<CoffeeType | null>(null);

  const handleOrder = async (coffee: CoffeeType) => {
    setOrderingItem(coffee);

    // Simulate order processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    onOrderPlace(coffee);
    setOrderingItem(null);
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
                disabled={!item.available || orderingItem === item.name}
                className={`w-full transition-all duration-200 ${
                  item.available
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {orderingItem === item.name ? (
                  <>
                    <Coffee className="mr-2 h-4 w-4 animate-pulse" />
                    Processing Order...
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
