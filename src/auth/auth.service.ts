import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './session.entity';
import { User } from '../user/user.entity';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import * as Joi from 'joi';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Session)
    private sessionRepo: Repository<Session>,
    @InjectRepository(User)
    private userRepo: Repository<User>
  ) {}

  async login(credentials: { email: string; password: string }): Promise<{
    message: string;
    access_token?: string;
    data?: any;
    statusCode: number;
  }> {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    });

    const { error, value } = schema.validate(credentials);
    if (error) {
      throw new HttpException(error.details[0].message, HttpStatus.BAD_REQUEST);
    }

    const { email, password } = value;
    const user = await this.userRepo.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundException('User does not exist.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new HttpException('Invalid Password', HttpStatus.UNAUTHORIZED);
    }

    delete user.password;

    // 🔐 Generate opaque token and store session
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await this.sessionRepo.save({
      token,
      user,
      expiresAt,
      ipAddress: '', // Optional: inject via req.ip
      userAgent: '', // Optional: inject via req.headers['user-agent']
    });

    return {
      statusCode: 200,
      message: 'Login successful',
      access_token: token,
      data: user,
    };
  }

  async validateToken(token: string): Promise<User | null> {
    const session = await this.sessionRepo.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!session || session.expiresAt < new Date()) return null;
    return session.user;
  }

  async logout(
    token: string
  ): Promise<{ statusCode: number; message: string }> {
    try {
      const result = await this.sessionRepo.delete({ token });
      if (result.affected === 0) {
        throw new NotFoundException('Session not found or already logged out');
      }
      return { statusCode: 200, message: 'Logout successful' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new HttpException(
        'Error during logout',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
