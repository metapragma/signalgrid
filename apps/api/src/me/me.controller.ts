import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('me')
export class MeController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: CurrentUserData) {
    const membership = await this.prisma.membership.findFirst({
      where: {
        userId: user.userId,
        tenantId: user.tenantId,
      },
      include: {
        user: true,
        tenant: true,
      },
    });

    if (!membership) {
      throw new Error('Membership not found');
    }

    return {
      user: {
        id: membership.user.id,
        email: membership.user.email,
      },
      tenant: {
        id: membership.tenant.id,
        name: membership.tenant.name,
      },
      role: membership.role,
    };
  }
}
