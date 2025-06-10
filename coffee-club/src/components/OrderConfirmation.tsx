
import { CheckCircle, Coffee, Clock, MapPin, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

interface Coffee {
  id: string;
  name: string;
  description: string;
  strength: number;
  prepTime: string;
  type: string;
  image: string;
}

interface OrderConfirmationProps {
  coffee: Coffee;
  onNewOrder: () => void;
}

const OrderConfirmation = ({ coffee, onNewOrder }: OrderConfirmationProps) => {
  const [orderStatus, setOrderStatus] = useState("confirmed");
  const [estimatedTime, setEstimatedTime] = useState(parseInt(coffee.prepTime));

  useEffect(() => {
    const timer = setTimeout(() => {
      setOrderStatus("preparing");
    }, 2000);

    const readyTimer = setTimeout(() => {
      setOrderStatus("ready");
    }, 8000);

    return () => {
      clearTimeout(timer);
      clearTimeout(readyTimer);
    };
  }, []);

  const getStatusInfo = () => {
    switch (orderStatus) {
      case "confirmed":
        return {
          icon: <CheckCircle className="h-8 w-8 text-green-600" />,
          title: "Order Confirmed!",
          description: "Your order has been confirmed on the Sui blockchain",
          color: "green"
        };
      case "preparing":
        return {
          icon: <Coffee className="h-8 w-8 text-amber-600 animate-pulse" />,
          title: "Preparing Your Coffee",
          description: "Our barista is crafting your perfect cup",
          color: "amber"
        };
      case "ready":
        return {
          icon: <CheckCircle className="h-8 w-8 text-green-600" />,
          title: "Coffee Ready!",
          description: "Your coffee is ready for pickup",
          color: "green"
        };
      default:
        return {
          icon: <Clock className="h-8 w-8 text-gray-600" />,
          title: "Processing",
          description: "Processing your order",
          color: "gray"
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      <div className="text-center">
        <div className="mb-4">
          {statusInfo.icon}
        </div>
        <h2 className="text-3xl font-bold text-amber-900 mb-2">
          {statusInfo.title}
        </h2>
        <p className="text-lg text-amber-700">
          {statusInfo.description}
        </p>
      </div>

      <Card className="w-full max-w-lg border-amber-200 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <span className="text-2xl">{coffee.image}</span>
            <span>{coffee.name}</span>
          </CardTitle>
          <CardDescription>Order #SUI{Date.now().toString().slice(-6)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Status:</span>
              <Badge className={`bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
                {orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Estimated Time:</span>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>{coffee.prepTime}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Pickup Location:</span>
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>Counter #1</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-medium">Blockchain:</span>
              <Badge variant="outline">Sui Network</Badge>
            </div>
          </div>

          {orderStatus === "ready" && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
              <p className="text-green-800 font-medium mb-2">
                🎉 Your coffee is ready for pickup!
              </p>
              <p className="text-sm text-green-600">
                Show this confirmation at the counter
              </p>
            </div>
          )}

          <div className="flex space-x-3">
            <Button 
              onClick={onNewOrder}
              variant="outline"
              className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              New Order Tomorrow
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-gray-600 max-w-md">
        <p>
          Remember: Each wallet can only order one coffee per day. 
          Come back tomorrow for another free coffee on the Sui blockchain!
        </p>
      </div>
    </div>
  );
};

export default OrderConfirmation;
