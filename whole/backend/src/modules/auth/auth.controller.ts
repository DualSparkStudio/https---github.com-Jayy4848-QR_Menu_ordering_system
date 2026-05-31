import { Controller, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('staff/login')
  @UseGuards(LocalAuthGuard)
  async staffLogin(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @Post('table/session')
  async createTableSession(@Body() body: { tableId: string; guestName?: string; guestPhone?: string; guestCount?: number }) {
    if (!body.tableId) throw new BadRequestException('tableId is required');
    return this.authService.createTableSession(body.tableId, body.guestName, body.guestPhone, body.guestCount);
  }

  @Post('refresh')
  async refreshToken(@Body() body: { refreshToken: string }) {
    if (!body.refreshToken) throw new BadRequestException('refreshToken is required');
    return this.authService.refreshToken(body.refreshToken);
  }
}
