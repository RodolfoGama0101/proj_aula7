import { Module } from '@nestjs/common';
import { DescarteController } from './descarte.controller';
import { DescarteService } from './descarte.service';

@Module({
  controllers: [DescarteController],
  providers: [DescarteService]
})
export class DescarteModule {}
