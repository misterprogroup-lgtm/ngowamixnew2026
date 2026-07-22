import { Controller, Post, Get, Param, UseGuards, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FollowsService } from './follows.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Follows')
@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post('toggle/:artistId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Follow / Unfollow un artiste' })
  toggleFollow(@CurrentUser('id') userId: string, @Param('artistId') artistId: string) {
    return this.followsService.toggleFollow(userId, artistId);
  }

  @Get('check/:artistId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vérifier si je suis un artiste' })
  isFollowing(@CurrentUser('id') userId: string, @Param('artistId') artistId: string) {
    return this.followsService.isFollowing(userId, artistId);
  }

  @Get('my-following')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes artistes suivis' })
  getMyFollowing(@CurrentUser('id') userId: string, @Query() pagination: PaginationDto) {
    return this.followsService.getMyFollowing(userId, pagination);
  }

  @Get('artist/:artistId/followers')
  @ApiOperation({ summary: 'Followers d\'un artiste' })
  getArtistFollowers(@Param('artistId') artistId: string, @Query() pagination: PaginationDto) {
    return this.followsService.getArtistFollowers(artistId, pagination);
  }
}
