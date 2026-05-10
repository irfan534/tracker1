import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    organization: {
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    session: {
      create: jest.fn(),
    },
    refreshToken: {
      updateMany: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(() => 'mock-token'),
  };

  const mockUsersService = {
    findById: jest.fn(),
  };

  const mockRequest = {
    ip: '127.0.0.1',
    get: jest.fn().mockReturnValue('mock-user-agent'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.login({ email: 'test@test.com', password: 'password' }, mockRequest)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password invalid', async () => {
      const hashedPassword = await argon2.hash('correct-password');
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        password: hashedPassword,
        status: 'ACTIVE',
        failedLoginAttempts: 0,
        organizationId: 'org1',
      });

      await expect(service.login({ email: 'test@test.com', password: 'wrong-password' }, mockRequest)).rejects.toThrow(UnauthorizedException);
      expect(mockPrismaService.user.update).toHaveBeenCalled(); // Should increment failed attempts
    });

    it('should lock account after 5 failed attempts', async () => {
        const hashedPassword = await argon2.hash('correct-password');
        mockPrismaService.user.findUnique.mockResolvedValue({
          id: '1',
          email: 'test@test.com',
          password: hashedPassword,
          status: 'ACTIVE',
          failedLoginAttempts: 4,
          organizationId: 'org1',
        });

        await expect(service.login({ email: 'test@test.com', password: 'wrong-password' }, mockRequest)).rejects.toThrow(UnauthorizedException);

        expect(mockPrismaService.user.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                failedLoginAttempts: 5,
                lockedUntil: expect.any(Date)
            })
        }));
    });
  });
});
