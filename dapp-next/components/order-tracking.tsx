import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Coffee, CheckCircle, Package, Timer } from "lucide-react";
import type { Order } from "@/app/page";

interface OrderTrackingProps {
  orders: Order[];
}

const statusConfig = {
  Created: {
    icon: Clock,
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    description: "Order received and confirmed",
    progress: 33,
  },
  Processing: {
    icon: Coffee,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    description: "Your coffee is being prepared",
    progress: 66,
  },
  Completed: {
    icon: CheckCircle,
    color:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    description: "Ready for pickup!",
    progress: 100,
  },
};

export function OrderTracking({ orders }: OrderTrackingProps) {
  if (orders.length === 0) {
    return (
      <Card className="border-blue-200 dark:border-blue-800">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-12 w-12 text-blue-400 mb-4" />
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
            No orders yet
          </h3>
          <p className="text-blue-600 dark:text-blue-400">
            Place your first order to see it here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const config = statusConfig[order.status];
        const StatusIcon = config.icon;

        return (
          <Card
            key={order.id}
            className="border-blue-200 dark:border-blue-800 shadow-md"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center space-x-2">
                  <span>{order.coffee}</span>
                  {order.status === "Processing" && (
                    <Timer className="h-4 w-4 text-blue-500 animate-pulse" />
                  )}
                </CardTitle>
                <Badge className={config.color}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {order.status}
                </Badge>
              </div>
              <CardDescription className="text-blue-600 dark:text-blue-400">
                Order #{order.id.split("-")[1]}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="w-full bg-blue-100 dark:bg-blue-900 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${config.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {config.description}
                  </p>
                  <span className="text-xs text-blue-500 dark:text-blue-400 font-medium">
                    {config.progress}%
                  </span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Ordered at {order.timestamp.toLocaleTimeString()}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
