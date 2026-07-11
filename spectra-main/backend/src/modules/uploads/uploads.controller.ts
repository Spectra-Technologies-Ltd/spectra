import {
  Controller,
  Post,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('incident/:id/photo')
  @Roles('EMPLOYEE', 'ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadIncidentPhoto(
    @Param('id') incidentId: string,
    @UploadedFile() file: any,
    @CurrentUser() user: any,
  ) {
    return this.uploadsService.attachIncidentPhoto(
      incidentId,
      file.filename,
      user.organizationId,
    );
  }

  @Post('incident/:id/video')
  @Roles('EMPLOYEE', 'ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadIncidentVideo(
    @Param('id') incidentId: string,
    @UploadedFile() file: any,
    @CurrentUser() user: any,
  ) {
    return this.uploadsService.attachIncidentVideo(
      incidentId,
      file.filename,
      user.organizationId,
    );
  }

  @Post('incident/:id/voice')
  @Roles('EMPLOYEE', 'ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadIncidentVoiceNote(
    @Param('id') incidentId: string,
    @UploadedFile() file: any,
    @CurrentUser() user: any,
  ) {
    return this.uploadsService.attachIncidentVoiceNote(
      incidentId,
      file.filename,
      user.organizationId,
    );
  }

  @Post('attendance/:id/photo')
  @Roles('EMPLOYEE', 'ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadAttendancePhoto(
    @Param('id') attendanceId: string,
    @UploadedFile() file: any,
    @CurrentUser() user: any,
  ) {
    return this.uploadsService.attachAttendancePhoto(
      attendanceId,
      file.filename,
      user.organizationId,
    );
  }
}
