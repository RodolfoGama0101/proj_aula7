import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DescarteModule } from './descarte/descarte.module';

@Module({
  imports: [DescarteModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
