import { PrismaClient } from '@prisma/client';
import { config } from '../../config/environment-railway';

/**
 * Prisma adapter for Postgres database
 */
export class PrismaAdapter {
  private static prisma: PrismaClient;

  public static async connect(): Promise<void> {
    if (this.prisma) {
      return;
    }

    try {
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: config.database.url,
          },
        },
      });

      // Test the connection
      await this.prisma.$executeRaw`SELECT 1`;
      console.log('✓ Connected to Postgres database successfully');
    } catch (error) {
      console.error('✗ Failed to connect to Postgres database:', error);
      throw error;
    }
  }

  public static getInstance(): PrismaClient {
    if (!this.prisma) {
      throw new Error('Prisma client not initialized. Call connect() first.');
    }
    return this.prisma;
  }

  public static async disconnect(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
  }
}
