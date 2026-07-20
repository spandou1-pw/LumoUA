import { Body, Controller, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FilesService } from './files.service';
import { RequestUploadUrlDto } from './dto/request-upload-url.dto';

@Controller('media')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload-url')
  async requestUploadUrl(@CurrentUser('id') userId: string, @Body() dto: RequestUploadUrlDto) {
    return this.filesService.createUploadUrl(userId, dto);
  }

  @Post(':assetId/confirm')
  async confirmUpload(@CurrentUser('id') userId: string, @Param('assetId') assetId: string) {
    return this.filesService.confirmUpload(userId, assetId);
  }
}
