import { Injectable } from '@nestjs/common';

@Injectable()
export class AppDropdownService {
  constructor() {
    // Add your dependencies here if needed
  }

  getHello(): string {
    return 'Hello from dropdown App!';
  }
}
