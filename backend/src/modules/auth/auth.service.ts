import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ─── Register ────────────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new BadRequestException('Email already in use');

    const hash = await bcrypt.hash(dto.password, 12);
    const userRole = dto.email === 'caiobrumgiga@gmail.com' ? 'ADMIN' : 'USER';
    
    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, password: hash, role: userRole },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    return { ...tokens, user: this.sanitize(user) };
  }

  // ─── Login ───────────────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Conta inativa. Contate o suporte.');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // Update lastLogin and generate token
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    return { ...tokens, user: this.sanitize(user) };
  }

  // ─── Refresh ─────────────────────────────────────────────────────────────────

  async refresh(userId: number, rawRefreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshToken)
      throw new ForbiddenException('Access denied');
    if (!user.isActive) throw new ForbiddenException('Conta inativa. Contate o suporte.');

    const tokenMatches = await bcrypt.compare(rawRefreshToken, user.refreshToken);
    if (!tokenMatches) throw new ForbiddenException('Access denied');

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  // ─── Logout ──────────────────────────────────────────────────────────────────

  async logout(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async generateTokens(userId: number, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN') as any,
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: number, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hash },
    });
  }

  private sanitize(user: { id: number; name: string; email: string; role: string; shareCode?: string | null }) {
    return { id: user.id, name: user.name, email: user.email, role: user.role, shareCode: user.shareCode };
  }
}
