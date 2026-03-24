import { Controller, Get, Patch, Body, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Request() req: any) {
    const user = await this.usersService.findById(req.user.id);
    return { id: user.id, email: user.email, currency: user.currency, createdAt: user.createdAt };
  }

  @Patch('me/currency')
  async updateCurrency(@Request() req: any, @Body() dto: UpdateCurrencyDto) {
    const user = await this.usersService.updateCurrency(req.user.id, dto.currency);
    return { id: user.id, email: user.email, currency: user.currency, createdAt: user.createdAt };
  }
}
