jest.mock('firebase-admin/app', () => ({
  cert: jest.fn(),
  getApps: jest.fn(),
  initializeApp: jest.fn(),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(),
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ActivationCodeStatus, UserRole } from '@prisma/client';
import type { Request } from 'express';
import { ActivationCodesController } from './activation-codes.controller';
import { ActivationCodesService } from './activation-codes.service';
import { GenerateActivationCodesDto } from './dto/generate-activation-codes.dto';

describe('ActivationCodesController', () => {
  let controller: ActivationCodesController;
  let service: jest.Mocked<
    Pick<ActivationCodesService, 'generateActivationCodes'>
  >;

  beforeEach(async () => {
    service = {
      generateActivationCodes: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivationCodesController],
      providers: [
        {
          provide: ActivationCodesService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<ActivationCodesController>(
      ActivationCodesController,
    );
  });

  it('generates activation codes in response envelope', async () => {
    const dto: GenerateActivationCodesDto = {
      count: 2,
      role: UserRole.STAFF,
    };
    const result = {
      activationCodes: [
        {
          id: 'activation-code-1',
          code: 'ABC123',
          role: UserRole.STAFF,
          status: ActivationCodeStatus.AVAILABLE,
          createdAt: '2026-08-04T00:00:00.000Z',
        },
      ],
    };
    const request = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    } as Request;

    service.generateActivationCodes.mockResolvedValue(result);

    await expect(controller.generate(request, dto)).resolves.toEqual({
      data: result,
    });
    expect(service.generateActivationCodes).toHaveBeenCalledWith(
      'Bearer valid-token',
      dto,
    );
  });
});
