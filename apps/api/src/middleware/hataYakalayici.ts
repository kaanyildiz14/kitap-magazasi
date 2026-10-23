import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class HttpHatasi extends Error {
  constructor(
    public readonly durum: number,
    mesaj: string,
  ) {
    super(mesaj);
  }
}

export function hataYakalayici(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      hata: 'Geçersiz istek',
      detaylar: err.issues.map((i) => ({ alan: i.path.join('.'), mesaj: i.message })),
    });
  }
  if (err instanceof HttpHatasi) {
    return res.status(err.durum).json({ hata: err.message });
  }
  console.error(err);
  return res.status(500).json({ hata: 'Sunucu hatası' });
}
