import { Controller, Get, Param } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('cafes')
  async getAllCafes() {
    return this.eventsService.getAllCafes();
  }

  @Get('orders')
  async getAllOrders() {
    return this.eventsService.getAllOrders();
  }

  @Get('orders/:id')
  async getOrderById(@Param('id') id: string) {
    return this.eventsService.getOrderById(id);
  }
}
