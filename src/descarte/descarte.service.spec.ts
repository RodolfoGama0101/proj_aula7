import { Test, TestingModule } from '@nestjs/testing';
import { DescarteService } from './descarte.service';

describe('DescarteService', () => {
  let service: DescarteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DescarteService],
    }).compile();

    service = module.get<DescarteService>(DescarteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
