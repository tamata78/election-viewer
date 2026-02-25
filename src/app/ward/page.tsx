'use client';

import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Header } from '@/components/layout/header';
import { MeguroContent } from '@/app/meguro/page';
import { OtaContent } from '@/app/ota/page';

type Ward = 'meguro' | 'ota';

export default function WardPage() {
  const [ward, setWard] = useState<Ward>('meguro');

  const title = ward === 'meguro' ? '目黒区 選挙詳細分析' : '大田区 選挙詳細分析';
  const description =
    ward === 'meguro'
      ? '投票区別・時系列比較ダッシュボード（目黒区）'
      : '投票区別・時系列比較ダッシュボード（2024年 vs 2026年）';

  return (
    <AppShell>
      <Header title={title} description={description} />
      <div className="px-4 md:px-6 pt-3 pb-1">
        <div className="inline-flex gap-1 rounded-lg border p-1 text-sm bg-background">
          <button
            onClick={() => setWard('meguro')}
            className={`px-3 py-1 rounded-md transition-colors ${
              ward === 'meguro'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            目黒区
          </button>
          <button
            onClick={() => setWard('ota')}
            className={`px-3 py-1 rounded-md transition-colors ${
              ward === 'ota'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            大田区
          </button>
        </div>
      </div>
      {ward === 'meguro' ? <MeguroContent /> : <OtaContent />}
    </AppShell>
  );
}
