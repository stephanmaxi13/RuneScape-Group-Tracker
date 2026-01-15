import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AppService } from './app.service';
import { Snapshot } from './users/schemas/snapshot.schema';

describe('AppService', () => {
  let service: AppService;
  let model: any;

  const mockSnapshotModel = {
    new: jest.fn().mockResolvedValue({}),
    constructor: jest.fn().mockResolvedValue({}),
    find: jest.fn(),
    create: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: getModelToken(Snapshot.name),
          useValue: mockSnapshotModel,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
    model = module.get(getModelToken(Snapshot.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});