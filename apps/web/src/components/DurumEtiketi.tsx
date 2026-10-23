import { DURUM_ETIKETI, SiparisDurumu } from '@/lib/tipler';

const RENK: Record<SiparisDurumu, string> = {
  hazirlaniyor: 'bg-[#B9852A]/15 text-[#7a5715]',
  kargoda: 'bg-[#2E4A7A]/12 text-[#2E4A7A]',
  teslim_edildi: 'bg-eylem/12 text-eylem',
  iptal: 'bg-hata/10 text-hata',
};

export function DurumEtiketi({ durum }: { durum: SiparisDurumu }) {
  return <span className={`rounded-full px-3 py-1 text-sm font-bold ${RENK[durum]}`}>{DURUM_ETIKETI[durum]}</span>;
}
