import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Commentaires')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('track/:trackId')
  @ApiOperation({ summary: 'Commentaires d\'un morceau' })
  findByTrack(@Param('trackId') trackId: string, @Query() pagination: PaginationDto) {
    return this.commentsService.findByTrack(trackId, pagination);
  }

  @Post('track/:trackId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ajouter un commentaire' })
  create(@CurrentUser('id') userId: string, @Param('trackId') trackId: string, @Body('content') content: string) {
    return this.commentsService.create(userId, trackId, content);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un commentaire' })
  delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.commentsService.delete(userId, id);
  }
}
