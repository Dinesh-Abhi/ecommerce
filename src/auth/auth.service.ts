import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService
  ) {}


  async login(loginDto: any): Promise<any> {
    const { email, password } = loginDto;
    const user = await this.usersService.getUserByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials'); 
    }
    const payload = { email: user.email, name: user.name };
    const accessToken = this.jwtService.sign(payload);
    return {
      Error: false,
      message: 'Login successful',
      accessToken,
    };
  }

    // Register user
    async register(registerDto: RegisterDto) {
      try {
        const createdUser = await this.usersService.createUser(registerDto);
        return {
          Error: false,
          message: 'Created successfully',      
          payload:createdUser,  
        };
      } catch (error) {
        return {
          Error: true,
          message: error.message || 'Failed to create user',
        };
      }
    }
}
