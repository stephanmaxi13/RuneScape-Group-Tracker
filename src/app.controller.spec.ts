import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AppService } from './app.service';
import { HttpService } from '@nestjs/axios';
import { Player } from './players/schemas/player.schema';
import { Group } from './groups/schemas/group.schema';
import { Gains } from './groups/schemas/gains.schema';
import { PlayersService } from './players/players.service';

describe('PlayersService', () => {
  let service: PlayersService;

  // 1. Create a mock for the HttpService
  const mockHttpService = {
    get: jest.fn(),
  };

  // 2. Create a generic mock for Mongoose Models
  const mockModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    create: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        // 3. Provide the HttpService mock
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        // 4. Provide the Player Model mock
        {
          provide: getModelToken(Player.name),
          useValue: mockModel,
        },
        // 5. Provide the Group Model mock
        {
          provide: getModelToken(Group.name),
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
