import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getEMS(): string {
    return 'Welcome to EMS Backend!';
  }
}
