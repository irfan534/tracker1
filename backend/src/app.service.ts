import { Injectable } from '@nestjs/common';
import { PrismaService } from './common/prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async getHealth() {
    const isDbConnected = await this.prisma.isConnected();
    return {
      status: 'ok',
      uptime: process.uptime(),
      db: isDbConnected ? 'connected' : 'disconnected',
    };
  }

  getInfo() {
    return {
      name: 'Tracker API',
      description: 'Enterprise Compliance & Certification Management Platform',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
