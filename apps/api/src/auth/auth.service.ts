import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  tenantId: string;
  role: string;
}

export interface RefreshTokenPayload {
  sub: string; // userId
  tokenId: string; // unique identifier for this refresh token
  type: 'refresh';
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
  };
  token: string;
  expiresAt: string;
  refreshToken: string;
}

export interface RefreshResult {
  token: string;
  expiresAt: string;
}

// Access token expiration in milliseconds (15 minutes)
const ACCESS_TOKEN_EXPIRY_MS = 15 * 60 * 1000;
// Refresh token expiration in seconds (7 days)
const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60;

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET') || '';
  }

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

    const { token, expiresAt } = this.generateAccessToken(
      user.id,
      user.email,
      membership.tenantId,
      membership.role,
    );
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      user: { id: user.id, email: user.email },
      token,
      expiresAt,
      refreshToken,
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

    const { token, expiresAt } = this.generateAccessToken(
      user.id,
      user.email,
      membership.tenantId,
      membership.role,
    );
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      user: { id: user.id, email: user.email },
      token,
      expiresAt,
      refreshToken,
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

  /**
   * Refresh the access token using a valid refresh token
   */
  async refresh(refreshToken: string): Promise<RefreshResult> {
    // Verify the refresh token
    let payload: RefreshTokenPayload;
    try {
      payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken, {
        secret: this.jwtSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Ensure it's a refresh token, not an access token
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    // Hash the token to find it in the database
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Find valid refresh token in DB
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token has been revoked or invalid');
    }

    if (storedToken.expiresAt < new Date()) {
      // Clean up expired token
      await this.prisma.refreshToken.delete({ where: { tokenHash } });
      throw new UnauthorizedException('Refresh token expired');
    }

    // Get user with memberships
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        memberships: {
          include: { tenant: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const membership = user.memberships[0];
    if (!membership) {
      throw new UnauthorizedException('User has no tenant membership');
    }

    // Rotate refresh token (optional security measure, preventing replay attacks)
    // For now, we'll keep the same refresh token until it expires to simplify,
    // or we could issue a new one and delete the old one.
    // Let's implement rotation: delete old, issue new.
    await this.prisma.refreshToken.delete({ where: { tokenHash } });
    const newRefreshToken = await this.generateRefreshToken(user.id);

    // Generate new access token
    const { token, expiresAt } = this.generateAccessToken(
      user.id,
      user.email,
      membership.tenantId,
      membership.role,
    );

    // Note: The controller needs to attach the NEW refresh token to the cookie.
    // However, the return type `RefreshResult` only has { token, expiresAt }.
    // We should probably update the controller and this return type to include the new refresh token.
    // But to minimize interface changes, we can rely on the client using the new access token.
    // Wait, if we rotate the refresh token, we MUST send it back to the client (in the cookie).
    // The current `RefreshResponseSchema` in contracts doesn't include the refresh token (it's in cookie).
    // The controller currently does:
    // @Post('refresh')
    // async refresh(@Req() req, @Res({ passthrough: true }) res) { ... }

    // So we need to return the new refresh token from here so the controller can set the cookie.

    // NOTE: This changes the internal signature but not the public API contract (since refresh token is cookie-only)
    // We will cast the return type to `Promise<RefreshResult & { refreshToken: string }>` internally.
    return { token, expiresAt, refreshToken: newRefreshToken } as any;
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    try {
      await this.prisma.refreshToken.delete({
        where: { tokenHash },
      });
    } catch {
      // Ignore if token not found
    }
  }

  private generateAccessToken(
    userId: string,
    email: string,
    tenantId: string,
    role: string,
  ): { token: string; expiresAt: string } {
    const payload: JwtPayload = {
      sub: userId,
      email,
      tenantId,
      role,
    };

    const token = this.jwtService.sign(payload);
    const expiresAt = new Date(Date.now() + ACCESS_TOKEN_EXPIRY_MS).toISOString();

    return { token, expiresAt };
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const payload: RefreshTokenPayload = {
      sub: userId,
      tokenId: crypto.randomUUID(),
      type: 'refresh',
    };

    const token = this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      expiresIn: REFRESH_TOKEN_EXPIRY_SECONDS,
    });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_SECONDS * 1000);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
      },
    });

    return token;
  }
}
