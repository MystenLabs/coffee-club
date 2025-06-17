"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coffee, Clock, CheckCircle, AlertCircle } from "lucide-react";
import type { CoffeeType } from "@/app/page";

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

const coffeeItems: CoffeeItem[] = [
  {
    name: "Espresso",
    description: "Rich and bold single shot of espresso",
    available: true,
    icon: "☕",
    intensity: 5,
  },
  {
    name: "Americano",
    description: "Espresso shots with hot water",
    available: true,
    icon: "🫖",
    intensity: 3,
  },
  {
    name: "Doppio",
    description: "Double shot of espresso",
    available: true,
    icon: "☕☕",
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
    name: "HotWater",
    description: "Pure hot water",
    available: true,
    icon: "💧",
    intensity: 0,
  },
  {
    name: "Coffee",
    description: "Classic drip coffee",
    available: true,
    icon: "☕",
    intensity: 3,
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
      {coffeeItems.map((item) => (
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
