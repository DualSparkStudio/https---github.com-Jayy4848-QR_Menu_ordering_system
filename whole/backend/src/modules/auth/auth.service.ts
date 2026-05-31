import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateStaff(email: string, password: string) {
    const staff = await this.prisma.staff.findFirst({ where: { email } });
    if (!staff) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, staff.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (!staff.isActive) throw new UnauthorizedException('Account is inactive');
    return staff;
  }

  async login(staff: any) {
    const payload = {
      sub: staff.id,
      email: staff.email,
      role: staff.role,
      restaurantId: staff.restaurantId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    await this.prisma.staff.update({
      where: { id: staff.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      accessToken,
      refreshToken,
      staff: {
        id: staff.id,
        email: staff.email,
        name: staff.name,
        role: staff.role,
        restaurantId: staff.restaurantId,
      },
    };
  }

  async createTableSession(tableId: string, guestName?: string, guestPhone?: string, guestCount?: number) {
    const table = await this.prisma.table.findUnique({ where: { id: tableId } });
    if (!table) throw new BadRequestException('Table not found');

    const sessionToken = uuidv4();
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

    await this.prisma.tableSession.create({
      data: { tableId, sessionToken, guestName, guestPhone, guestCount: guestCount || 1, expiresAt },
    });

    return { sessionToken, tableId, restaurantId: table.restaurantId, expiresAt };
  }

  async validateTableSession(sessionToken: string) {
    const session = await this.prisma.tableSession.findUnique({
      where: { sessionToken },
      include: { table: true },
    });

    if (!session) throw new UnauthorizedException('Invalid session');
    if (!session.isActive) throw new UnauthorizedException('Session is inactive');
    if (new Date() > session.expiresAt) throw new UnauthorizedException('Session expired');

    return session;
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const accessToken = this.jwtService.sign({
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        restaurantId: payload.restaurantId,
      });
      return { accessToken };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
