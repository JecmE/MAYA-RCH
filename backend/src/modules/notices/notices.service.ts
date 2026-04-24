import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Aviso } from '../../entities/aviso.entity';

@Injectable()
export class NoticesService implements OnModuleInit {
  constructor(
    @InjectRepository(Aviso)
    private avisoRepository: Repository<Aviso>,
    private dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.createTableIfNotExist();
  }

  private async createTableIfNotExist() {
    try {
      await this.dataSource.query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AVISO]') AND type in (N'U'))
        BEGIN
          CREATE TABLE [dbo].[AVISO] (
            [aviso_id] INT IDENTITY(1,1) PRIMARY KEY,
            [usuario_id] INT NOT NULL,
            [titulo] NVARCHAR(100) NOT NULL,
            [mensaje] NVARCHAR(MAX) NOT NULL,
            [tipo] NVARCHAR(20) DEFAULT 'info',
            [fecha_hora] DATETIME DEFAULT GETDATE(),
            [leido] BIT DEFAULT 0,
            CONSTRAINT FK_AVISO_USUARIO FOREIGN KEY (usuario_id) REFERENCES USUARIO(usuario_id)
          )
        END
      `);
      console.log('✅ Tabla AVISO verificada/creada correctamente.');
    } catch (e) {
      console.error('❌ Error creando tabla AVISO:', e.message);
    }
  }

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
