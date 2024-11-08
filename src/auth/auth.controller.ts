import { Controller, Post, Body } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiBody({ type: LoginDto })
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const response = await this.authService.login(loginDto);
      return response; 
    } catch (error) {
      return { Error: true, message: error.message };
    }
  }

  @ApiBody({ type: RegisterDto })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const response = await this.authService.register(registerDto);
    return response;
  }
}
