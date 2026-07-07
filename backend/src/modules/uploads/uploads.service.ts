import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';

@Injectable()
export class UploadsService {
  constructor(private prisma: PrismaService) {}

  getFileUrl(filename: string): string {
    const baseUrl = process.env.API_URL || 'http://localhost:3001';
    return `${baseUrl}/uploads/${filename}`;
  }

  async attachIncidentPhoto(
    incidentId: string,
    filename: string,
    organizationId: string,
  ) {
    const incident = await this.prisma.incident.findFirst({
      where: { id: incidentId, site: { organizationId } },
      select: { id: true, photos: true },
    });
    if (!incident) throw new NotFoundException('Incident not found');

    const photos = JSON.parse(incident.photos || '[]');
    photos.push(this.getFileUrl(filename));

    return this.prisma.incident.update({
      where: { id: incidentId },
      data: { photos: JSON.stringify(photos) },
    });
  }

  async attachIncidentVideo(
    incidentId: string,
    filename: string,
    organizationId: string,
  ) {
    const incident = await this.prisma.incident.findFirst({
      where: { id: incidentId, site: { organizationId } },
      select: { id: true, videos: true },
    });
    if (!incident) throw new NotFoundException('Incident not found');

    const videos = JSON.parse(incident.videos || '[]');
    videos.push(this.getFileUrl(filename));

    return this.prisma.incident.update({
      where: { id: incidentId },
      data: { videos: JSON.stringify(videos) },
    });
  }

  async attachIncidentVoiceNote(
    incidentId: string,
    filename: string,
    organizationId: string,
  ) {
    const incident = await this.prisma.incident.findFirst({
      where: { id: incidentId, site: { organizationId } },
      select: { id: true, voiceNotes: true },
    });
    if (!incident) throw new NotFoundException('Incident not found');

    const notes = JSON.parse(incident.voiceNotes || '[]');
    notes.push(this.getFileUrl(filename));

    return this.prisma.incident.update({
      where: { id: incidentId },
      data: { voiceNotes: JSON.stringify(notes) },
    });
  }

  async attachAttendancePhoto(
    attendanceId: string,
    filename: string,
    organizationId: string,
  ) {
    const attendance = await this.prisma.attendance.findFirst({
      where: { id: attendanceId, guard: { organizationId } },
      select: { id: true },
    });
    if (!attendance) throw new NotFoundException('Attendance record not found');

    return this.prisma.attendance.update({
      where: { id: attendanceId },
      data: { photoUrl: this.getFileUrl(filename) },
    });
  }
}
