import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupListeners } from './indexer/event-indexer';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Start the event listeners after the app is initialized
  await setupListeners();

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
