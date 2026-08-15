import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger('Leads');

  create(payload: Record<string, any>): { success: boolean } {
    // TODO: persist to a `leads` table/collection or send an email notification.
    // For now the payload is captured in the backend logs so no leads are lost.
    this.logger.log(
      `New demo request received:\n${JSON.stringify(payload, null, 2)}`,
    );
    return { success: true };
  }
}
