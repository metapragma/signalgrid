import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  tenantId: string;
  role: string;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
  };
  token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string): Promise<AuthResult> {
    // Check if user already exists
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with a new tenant (user becomes OWNER)
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        memberships: {
          create: {
            role: 'OWNER',
            tenant: {
              create: {
                name: `${email}'s Workspace`,
              },
            },
          },
        },
      },
      include: {
        memberships: {
          include: { tenant: true },
        },
      },
    });

    // Get the membership for JWT
    const membership = user.memberships[0];

    const token = this.generateToken(user.id, user.email, membership.tenantId, membership.role);

    return {
      user: { id: user.id, email: user.email },
      token,
    };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    // Find user with memberships
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: { tenant: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get the first membership (users can belong to multiple tenants, but we use the first for now)
    const membership = user.memberships[0];
    if (!membership) {
      throw new UnauthorizedException('User has no tenant membership');
    }

    const token = this.generateToken(user.id, user.email, membership.tenantId, membership.role);

    return {
      user: { id: user.id, email: user.email },
      token,
    };
  }

  async validateUser(payload: JwtPayload): Promise<{
    userId: string;
    email: string;
    tenantId: string;
    role: string;
  } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      return null;
    }

    return {
      userId: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      role: payload.role,
    };
  }

  private generateToken(userId: string, email: string, tenantId: string, role: string): string {
    const payload: JwtPayload = {
      sub: userId,
      email,
      tenantId,
      role,
    };

    return this.jwtService.sign(payload);
  }
}
