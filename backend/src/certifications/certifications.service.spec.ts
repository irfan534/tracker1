import { Test, TestingModule } from '@nestjs/testing';
import { CertificationsService } from './certifications.service';
import { PrismaService } from '../common/prisma/prisma.service';

describe('CertificationsService', () => {
  let service: CertificationsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    certification: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    organization: {
      count: jest.fn(),
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificationsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CertificationsService>(CertificationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should only return certifications for the given organization', async () => {
      const organizationId = 'org1';
      mockPrismaService.certification.findMany.mockResolvedValue([]);
      mockPrismaService.certification.count.mockResolvedValue(0);

      await service.findAll(organizationId);

      expect(mockPrismaService.certification.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ organizationId })
      }));
    });
  });

  describe('update', () => {
    it('should check organizationId to prevent IDOR', async () => {
        const id = 'cert1';
        const organizationId = 'org1';
        const data = { name: 'Updated' };

        mockPrismaService.certification.update.mockResolvedValue({ id, ...data });

        await service.update(id, organizationId, data);

        // This test EXPECTS organizationId to be in the where clause.
        // Currently, it will FAIL if we actually ran it against the real DB logic,
        // but since we are mocking it and just checking the CALL,
        // it serves as a documentation of what SHOULD happen.
        expect(mockPrismaService.certification.update).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({ id, organizationId }),
        }));
    });
  });
});
