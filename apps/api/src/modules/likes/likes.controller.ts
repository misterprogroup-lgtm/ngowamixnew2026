import { Controller, Post, Get, Param, UseGuards, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Likes')
@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post('toggle/:trackId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Like / Unlike un morceau' })
  toggleLike(@CurrentUser('id') userId: string, @Param('trackId') trackId: string) {
    return this.likesService.toggleLike(userId, trackId);
  }

  @Get('check/:trackId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vérifier si un morceau est liké' })
  isLiked(@CurrentUser('id') userId: string, @Param('trackId') trackId: string) {
    return this.likesService.isLiked(userId, trackId);
  }

  @Get('my-likes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes morceaux likés' })
  getMyLikedTracks(@CurrentUser('id') userId: string, @Query() pagination: PaginationDto) {
    return this.likesService.getMyLikedTracks(userId, pagination);
  }
}
