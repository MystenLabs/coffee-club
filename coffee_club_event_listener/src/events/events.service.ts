import { Injectable } from '@nestjs/common';
import { prisma } from '../db';

@Injectable()
export class EventsService {
  async getAllCafes() {
    return prisma.cafe.findMany();
  }

  async getAllOrders() {
    return prisma.coffeeOrder.findMany();
  }

  async getOrderById(id: string) {
    return prisma.coffeeOrder.findUnique({
      where: { objectId: id },
    });
  }
}
