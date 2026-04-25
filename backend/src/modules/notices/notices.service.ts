import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Aviso } from '../../entities/aviso.entity';

@Injectable()
export class NoticesService {
  constructor(
    @InjectRepository(Aviso)
    private avisoRepository: Repository<Aviso>,
    private dataSource: DataSource,
  ) {}

  async getMyNotices(usuarioId: number) {
    try {
      return await this.avisoRepository.find({
        where: { usuarioId },
        order: { fechaHora: 'DESC' },
      });
    } catch (e) {
      return [];
    }
  }

  async createNotice(usuarioId: number, titulo: string, mensaje: string, tipo: string = 'info') {
    try {
      const aviso = this.avisoRepository.create({
        usuarioId,
        titulo,
        mensaje,
        tipo,
      });
      return await this.avisoRepository.save(aviso);
    } catch (e) {
      console.error('Error al guardar aviso:', e.message);
      return null;
    }
  }

  async deleteNotice(avisoId: number, usuarioId: number) {
    return this.avisoRepository.delete({ avisoId, usuarioId });
  }

  async clearAll(usuarioId: number) {
    return this.avisoRepository.delete({ usuarioId });
  }
}
