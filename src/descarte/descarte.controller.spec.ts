import { Test, TestingModule } from '@nestjs/testing';
import { DescarteController } from './descarte.controller';

describe('DescarteController', () => {
  let controller: DescarteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DescarteController],
    }).compile();

    controller = module.get<DescarteController>(DescarteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
