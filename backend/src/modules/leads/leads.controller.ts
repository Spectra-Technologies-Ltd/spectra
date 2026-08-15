import { Body, Controller, Post } from '@nestjs/common';
import { LeadsService } from './leads.service';

const REQUIRED_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'jobTitle',
  'organizationName',
  'country',
  'message',
];

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  create(@Body() body: Record<string, any>) {
    const missing = REQUIRED_FIELDS.filter((field) => !body?.[field]);
    if (missing.length > 0) {
      return {
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`,
      };
    }
    return this.leadsService.create(body);
  }
}
