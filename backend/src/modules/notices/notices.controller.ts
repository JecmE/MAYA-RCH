import { Controller, Get, Delete, Param, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import { NoticesService } from './notices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notices')
@UseGuards(JwtAuthGuard)
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Get()
  getMyNotices(@Req() req: any) {
    return this.noticesService.getMyNotices(req.user.usuarioId);
  }

  @Delete(':id')
  deleteNotice(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.noticesService.deleteNotice(id, req.user.usuarioId);
  }

  @Delete()
  clearAll(@Req() req: any) {
    return this.noticesService.clearAll(req.user.usuarioId);
  }
}
