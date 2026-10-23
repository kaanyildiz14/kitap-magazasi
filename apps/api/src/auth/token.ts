import { jwtVerify, SignJWT } from 'jose';
import { Rol } from './kullanici';

export interface TokenIcerigi {
  kullaniciId: number;
  rol: Rol;
}

export class TokenServisi {
  private readonly anahtar: Uint8Array;

  constructor(
    gizliAnahtar: string,
    private readonly gecerlilik = '7d',
  ) {
    this.anahtar = new TextEncoder().encode(gizliAnahtar);
  }

  imzala({ kullaniciId, rol }: TokenIcerigi): Promise<string> {
    return new SignJWT({ rol })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(String(kullaniciId))
      .setIssuedAt()
      .setExpirationTime(this.gecerlilik)
      .sign(this.anahtar);
  }

  /** Geçersiz, süresi dolmuş ya da değiştirilmiş token için null döner. */
  async dogrula(token: string): Promise<TokenIcerigi | null> {
    try {
      const { payload } = await jwtVerify(token, this.anahtar, { algorithms: ['HS256'] });
      const kullaniciId = Number(payload.sub);
      if (!Number.isInteger(kullaniciId)) return null;
      return { kullaniciId, rol: payload.rol as Rol };
    } catch {
      return null;
    }
  }
}
