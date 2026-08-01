import {
  Controller,
  Post,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadsController {
  private readonly logger = new Logger(UploadsController.name);

  constructor(
    private cloudinary: CloudinaryService,
    private prisma: PrismaService,
  ) {}

  /**
   * Upload a guard's profile photo.
   * POST /uploads/guard/:id/photo
   */
  @Post('guard/:id/photo')
  @Roles('ADMIN', 'EMPLOYEE')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Only image files are allowed'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadGuardPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { organizationId: string },
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const guard = await this.prisma.guard.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!guard) {
      throw new BadRequestException(
        'Guard not found in your organization',
      );
    }

    const url = await this.uploadAndPersist(file, 'guards');

    await this.prisma.guard.update({
      where: { id },
      data: { photoUrl: url },
    });

    return { photoUrl: url };
  }

  /**
   * Upload the authenticated user's profile photo.
   * POST /uploads/user/photo
   */
  @Post('user/photo')
  @Roles('ADMIN', 'EMPLOYEE')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Only image files are allowed'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadUserPhoto(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { id: string },
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const url = await this.uploadAndPersist(file, 'users');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { photoUrl: url },
    });

    return { photoUrl: url };
  }

  /**
   * Upload to Cloudinary if configured, otherwise save locally.
   */
  private async uploadAndPersist(
    file: Express.Multer.File,
    folder: string,
  ): Promise<string> {
    if (this.cloudinary.isConfigured()) {
      const result = await this.cloudinary.uploadImage(file.buffer, folder);
      return result.url;
    }

    // Fallback: save to local disk
    const uploadDir = join(process.cwd(), 'uploads', 'photos');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    const filename = `${Date.now()}-${file.originalname}`;
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, file.buffer);
    return `/uploads/photos/${filename}`;
  }
}
