import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication; // Define the app instance
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // We use the in-memory URI here
        MongooseModule.forRoot(uri),
        AppModule,
      ],
    }).compile();

    // Create the Nest application instance
    app = moduleFixture.createNestApplication();
    await app.init(); // This is crucial for the HTTP server to start
  });

  afterAll(async () => {
    await app.close(); // Close the Nest app first
    await mongod.stop(); // Then stop MongoDB
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/get-gains')
      .query({ groupName: 'TestGroup', period: 'weekly' })
      .expect(200)
      .expect((res) => {
        if (res.status === 404)
          console.log('Check if you have a @Get("/") in AppController');
      });
  });
});
