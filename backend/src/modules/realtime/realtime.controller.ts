import {
  Controller,
  Get,
  Req,
  Res,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { RealtimeService } from './realtime.service';

/**
 * Server-Sent Events endpoint. The browser connects via EventSource and
 * receives domain events (incidents, check-ins, notifications) in real time —
 * no polling, no WebSocket dependency. Auth is resolved from the `token`
 * query param (EventSource cannot set headers) or the access cookie.
 */
@Controller('realtime')
export class RealtimeController {
  private readonly logger = new Logger(RealtimeController.name);

  constructor(
    private realtime: RealtimeService,
    private jwt: JwtService,
  ) {}

  @Get('stream')
  async stream(@Req() req: Request, @Res() res: Response) {
    const token =
      (req.query.token as string) || (req.cookies?.access_token as string);
    if (!token) throw new UnauthorizedException('Missing token');

    let payload: any;
    try {
      payload = this.jwt.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Initial comment to open the stream
    res.write(': connected\n\n');

    const heartbeat = setInterval(() => {
      res.write(': ping\n\n');
    }, 25000);

    const unsubscribe = this.realtime.subscribe(
      payload.organizationId,
      (_event, message) => {
        res.write(`data: ${message}\n\n`);
      },
    );

    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
      res.end();
    });

    this.logger.log(`SSE client connected (org ${payload.organizationId})`);
  }
}
