
import { Coffee, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Coffee {
  id: string;
  name: string;
  description: string;
  strength: number;
  prepTime: string;
  type: string;
  image: string;
}

interface CoffeeMenuProps {
  onCoffeeSelect: (coffee: Coffee) => void;
  selectedCoffee: Coffee | null;
  onOrderPlace: () => void;
}

const coffees: Coffee[] = [
  {
    id: "1",
    name: "Classic Espresso",
    description: "Rich, bold espresso with a perfect crema. The foundation of all great coffee drinks.",
    strength: 5,
    prepTime: "2-3 min",
    type: "Hot",
    image: "☕"
  },
  {
    id: "2", 
    name: "Smooth Americano",
    description: "Espresso with hot water for a clean, pure coffee taste that's never bitter.",
    strength: 3,
    prepTime: "3-4 min",
    type: "Hot",
    image: "☕"
  },
  {
    id: "3",
    name: "Creamy Latte",
    description: "Espresso with steamed milk and a light layer of foam. Perfectly balanced and smooth.",
    strength: 2,
    prepTime: "4-5 min", 
    type: "Hot",
    image: "🥛"
  },
  {
    id: "4",
    name: "Frothy Cappuccino",
    description: "Equal parts espresso, steamed milk, and milk foam. A classic Italian favorite.",
    strength: 3,
    prepTime: "4-5 min",
    type: "Hot", 
    image: "☕"
  },
  {
    id: "5",
    name: "Iced Cold Brew",
    description: "Slow-steeped coffee concentrate served over ice. Smooth and refreshing.",
    strength: 4,
    prepTime: "1-2 min",
    type: "Cold",
    image: "🧊"
  },
  {
    id: "6",
    name: "Vanilla Macchiato",
    description: "Espresso with vanilla syrup, steamed milk, and a caramel drizzle on top.",
    strength: 2,
    prepTime: "5-6 min",
    type: "Hot",
    image: "🍦"
  }
];

const CoffeeMenu = ({ onCoffeeSelect, selectedCoffee, onOrderPlace }: CoffeeMenuProps) => {
  const renderStrengthStars = (strength: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-3 w-3 ${i < strength ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-amber-900 mb-4">Choose Your Coffee</h2>
        <p className="text-amber-700 text-lg">
          Select your favorite coffee and place your order. Each wallet can order one coffee per day!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coffees.map((coffee) => (
          <Card 
            key={coffee.id}
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 ${
              selectedCoffee?.id === coffee.id 
                ? 'border-amber-500 bg-amber-50 shadow-lg' 
                : 'border-amber-200 hover:border-amber-300'
            }`}
            onClick={() => onCoffeeSelect(coffee)}
          >
            <CardHeader className="text-center pb-4">
              <div className="text-4xl mb-2">{coffee.image}</div>
              <CardTitle className="text-xl text-amber-900">{coffee.name}</CardTitle>
              <div className="flex items-center justify-center space-x-4">
                <Badge variant={coffee.type === 'Hot' ? 'default' : 'secondary'} className="bg-amber-100 text-amber-800">
                  {coffee.type}
                </Badge>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-600">{coffee.prepTime}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <CardDescription className="text-center text-gray-600">
                {coffee.description}
              </CardDescription>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-sm font-medium text-amber-700">Strength:</span>
                <div className="flex space-x-1">
                  {renderStrengthStars(coffee.strength)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedCoffee && (
        <div className="flex justify-center">
          <Card className="w-full max-w-md border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <CardTitle className="text-green-800">Ready to Order?</CardTitle>
              <CardDescription>
                You've selected: <strong>{selectedCoffee.name}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={onOrderPlace}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
              >
                <div className="flex items-center space-x-2">
                  <Coffee className="h-4 w-4" />
                  <span>Place Order (FREE)</span>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CoffeeMenu;
