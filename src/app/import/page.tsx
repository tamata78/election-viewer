'use client';

import { useState, useCallback } from 'react';
import { AppShell } from '@/components/app-shell';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { parseElectionCSV, validateCSVStructure } from '@/lib/csv-parser';
import { formatNumber } from '@/lib/utils';
import type { ElectionResult } from '@/types/election';
import { Upload, FileText, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

interface ImportedFile {
  id: string;
  name: string;
  recordCount: number;
  importedAt: Date;
  data: ElectionResult[];
}

function ImportContent() {
  const [dragActive, setDragActive] = useState(false);
  const [importedFiles, setImportedFiles] = useState<ImportedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ElectionResult[] | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setPreview(null);

    if (!file.name.endsWith('.csv')) {
      setError('CSVファイルのみ対応しています');
      return;
    }

    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map((h) => h.trim());

      const validation = validateCSVStructure(headers);
      if (!validation.valid) {
        setError(`必須カラムが不足しています: ${validation.missingFields.join(', ')}`);
        return;
      }

      const data = parseElectionCSV(text);

      if (data.length === 0) {
        setError('有効なデータが見つかりませんでした');
        return;
      }

      setPreview(data.slice(0, 10));

      const newFile: ImportedFile = {
        id: Date.now().toString(),
        name: file.name,
        recordCount: data.length,
        importedAt: new Date(),
        data,
      };

      setImportedFiles((prev) => [...prev, newFile]);
    } catch (err) {
      setError('ファイルの読み込みに失敗しました');
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processFile(e.dataTransfer.files[0]);
      }
    },
    [processFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        processFile(e.target.files[0]);
      }
    },
    [processFile]
  );

  const removeFile = useCallback((id: string) => {
    setImportedFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Drop Zone */}
      <Card>
        <CardHeader>
          <CardTitle>CSVインポート</CardTitle>
          <CardDescription>
            選挙データのCSVファイルをドラッグ&ドロップまたは選択してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              CSVファイルをここにドラッグ&ドロップ
            </p>
            <p className="text-xs text-muted-foreground mb-4">または</p>
            <label>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileInput}
              />
              <Button variant="outline" asChild>
                <span>ファイルを選択</span>
              </Button>
            </label>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CSV Format */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">CSVフォーマット</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            以下のカラムを含むCSVファイルをインポートできます：
          </p>
          <code className="block bg-muted p-3 rounded text-sm">
            year, region_type, region_name, district, party_name, candidate_name, votes, eligible_voters
          </code>
        </CardContent>
      </Card>

      {/* Preview */}
      {preview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              インポートプレビュー（先頭10件）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>年</TableHead>
                  <TableHead>地域</TableHead>
                  <TableHead>選挙区</TableHead>
                  <TableHead>政党</TableHead>
                  <TableHead>候補者</TableHead>
                  <TableHead className="text-right">得票数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{row.year}</TableCell>
                    <TableCell>{row.regionName}</TableCell>
                    <TableCell>{row.district}</TableCell>
                    <TableCell>{row.partyName}</TableCell>
                    <TableCell>{row.candidateName}</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(row.votes)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Imported Files */}
      {importedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">インポート済みファイル</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {importedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(file.recordCount)}件 ・{' '}
                        {file.importedAt.toLocaleString('ja-JP')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {[...new Set(file.data.map((d) => d.year))].join(', ')}年
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(file.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ImportPage() {
  return (
    <AppShell>
      <Header
        title="データ管理"
        description="CSVファイルのインポートと管理"
      />
      <ImportContent />
    </AppShell>
  );
}
