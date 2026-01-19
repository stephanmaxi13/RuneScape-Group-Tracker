import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { HttpService } from '@nestjs/axios';
import { PlayersService } from './players.service';
import { Player } from './schemas/player.schema';
import { Gains } from '../groups/schemas/gains.schema';

describe('PlayersService', () => {
  let service: PlayersService;

  // Mock for HttpService
  const mockHttpService = {
    get: jest.fn(),
  };

  // Mock for Mongoose Models
  const mockModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    create: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayersService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: getModelToken(Player.name),
          useValue: mockModel,
        },
        {
          provide: getModelToken(Gains.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<PlayersService>(PlayersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
