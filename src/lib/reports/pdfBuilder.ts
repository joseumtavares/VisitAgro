/**
 * src/lib/reports/pdfBuilder.ts — L036-C
 *
 * Geração real de PDF no servidor usando pdf-lib (^1.17.1).
 * Retorna Uint8Array pronto para stream como application/pdf.
 *
 * Características:
 *  - A4 retrato (595 × 842 pt)
 *  - Cabeçalho: logotipo (fetch remoto) + nome da empresa + metadados
 *  - Bloco de totais (grid de cards)
 *  - Tabela de dados com alternância de cor por linha e quebra de página automática
 *  - Rodapé com número de página e data/hora
 *  - Fonte: Helvetica (embutida no pdf-lib, sem deps externas)
 *
 * Escolha de biblioteca: pdf-lib v1.17.1
 *  - ~500 KB, zero dependências nativas
 *  - Compatível com Node 20 + Vercel serverless
 *  - API programática simples, sem React runtime
 *  - Suporte a embed de imagem PNG/JPG remota
 */

import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';
import type { CompanyInfo } from './helpers';
import { fmtDatetime } from './helpers';

// ── Constantes de layout ───────────────────────────────────────────────────

const PAGE_W        = PageSizes.A4[0];  // 595.28
const PAGE_H        = PageSizes.A4[1];  // 841.89
const MARGIN        = 40;
const CONTENT_W     = PAGE_W - MARGIN * 2;
const GREEN         = rgb(0.02, 0.60, 0.41);   // #059669
const DARK          = rgb(0.07, 0.07, 0.07);
const GREY          = rgb(0.45, 0.45, 0.45);
const LIGHT_GREY    = rgb(0.96, 0.97, 0.98);
const WHITE         = rgb(1, 1, 1);
const HEADER_BG     = rgb(0.02, 0.60, 0.41);   // mesmo verde
const ROW_ALT_BG    = rgb(0.975, 0.982, 0.990);

// ── Tipos ─────────────────────────────────────────────────────────────────

export interface PdfSummaryCard { label: string; value: string; accent?: boolean }

export interface PdfColumn { header: string; key: string; width: number; align?: 'left' | 'right' }

export interface PdfMeta {
  company:        CompanyInfo;
  title:          string;
  period:         string;
  representative: string;
  generatedAt:    string; // ISO
}

// ── Fetch de imagem remota com timeout seguro ──────────────────────────────

async function fetchImageBytes(url: string): Promise<Uint8Array | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res  = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

// ── Builder principal ──────────────────────────────────────────────────────

/**
 * Gera PDF e retorna os bytes como Uint8Array.
 *
 * @param meta     - Metadados do relatório (empresa, título, período, representante)
 * @param summary  - Lista de cards de totalizadores
 * @param columns  - Definição das colunas da tabela
 * @param rows     - Dados: Record<colKey, string>[]
 */
export async function buildPdf(
  meta:    PdfMeta,
  summary: PdfSummaryCard[],
  columns: PdfColumn[],
  rows:    Record<string, string>[],
): Promise<Uint8Array> {
  const doc  = await PDFDocument.create();
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg  = await doc.embedFont(StandardFonts.Helvetica);

  // ── Metadados do documento ────────────────────────────────────────────
  const companyDisplay = meta.company.trade_name || meta.company.name;
  doc.setTitle(`${meta.title} — ${companyDisplay}`);
  doc.setAuthor(companyDisplay);
  doc.setCreationDate(new Date(meta.generatedAt));

  // ── Tentar carregar logotipo ──────────────────────────────────────────
  let logoEmbed: Awaited<ReturnType<typeof doc.embedPng>> | null = null;
  if (meta.company.logo_url) {
    const bytes = await fetchImageBytes(meta.company.logo_url);
    if (bytes) {
      try {
        const isPng = meta.company.logo_url.toLowerCase().includes('.png');
        logoEmbed = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
      } catch { /* logotipo inválido — ignorar */ }
    }
  }

  // ── Estado de paginação ───────────────────────────────────────────────
  let page      = doc.addPage(PageSizes.A4);
  let y         = PAGE_H - MARGIN;
  let pageNum   = 1;
  const totalPagesPlaceholder: Array<{ page: ReturnType<typeof doc.addPage>; y: number }> = [];

  // ── Funções de desenho ────────────────────────────────────────────────

  const newPage = () => {
    drawFooter(page, pageNum);
    page    = doc.addPage(PageSizes.A4);
    pageNum += 1;
    y       = PAGE_H - MARGIN;
    drawHeader();
    y -= 10;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN + 20) newPage();
  };

  const drawHeader = () => {
    // Barra verde superior
    page.drawRectangle({
      x: 0, y: PAGE_H - 70,
      width: PAGE_W, height: 70,
      color: HEADER_BG,
    });

    let logoX = MARGIN;

    // Logotipo
    if (logoEmbed) {
      const dims = logoEmbed.scaleToFit(52, 44);
      page.drawImage(logoEmbed, {
        x: MARGIN, y: PAGE_H - 57,
        width:  dims.width,
        height: dims.height,
      });
      logoX = MARGIN + dims.width + 12;
    } else {
      // Placeholder emoji substituído por texto
      page.drawText('VA', {
        x: MARGIN + 4, y: PAGE_H - 48,
        size: 24, font: bold, color: WHITE,
      });
      logoX = MARGIN + 44;
    }

    // Nome da empresa
    page.drawText(companyDisplay, {
      x: logoX, y: PAGE_H - 30,
      size: 14, font: bold, color: WHITE,
    });

    // Título do relatório
    page.drawText(meta.title, {
      x: logoX, y: PAGE_H - 46,
      size: 10, font: reg, color: WHITE,
    });

    // Sub-info direita
    const subY = PAGE_H - 26;
    const subText = `Período: ${meta.period}  |  ${meta.representative}`;
    const subW    = reg.widthOfTextAtSize(subText, 8);
    page.drawText(subText, {
      x: PAGE_W - MARGIN - subW, y: subY,
      size: 8, font: reg, color: WHITE,
    });

    y = PAGE_H - 80;
  };

  const drawFooter = (pg: typeof page, num: number) => {
    pg.drawLine({
      start: { x: MARGIN,          y: MARGIN - 4 },
      end:   { x: PAGE_W - MARGIN, y: MARGIN - 4 },
      thickness: 0.5, color: GREY,
    });

    pg.drawText(companyDisplay, {
      x: MARGIN, y: MARGIN - 14,
      size: 7, font: reg, color: GREY,
    });

    const genText = `Gerado em ${fmtDatetime(meta.generatedAt)}`;
    const pageText = `Página ${num}`;
    const rightW   = reg.widthOfTextAtSize(pageText, 7);

    pg.drawText(genText, {
      x: PAGE_W / 2 - reg.widthOfTextAtSize(genText, 7) / 2,
      y: MARGIN - 14,
      size: 7, font: reg, color: GREY,
    });

    pg.drawText(pageText, {
      x: PAGE_W - MARGIN - rightW, y: MARGIN - 14,
      size: 7, font: reg, color: GREY,
    });
  };

  // ── Desenhar primeira página ──────────────────────────────────────────
  drawHeader();
  y -= 8;

  // ── Bloco de totalizadores ────────────────────────────────────────────
  if (summary.length > 0) {
    const cardW  = Math.min(120, (CONTENT_W - (summary.length - 1) * 8) / summary.length);
    const cardH  = 42;
    let   cardX  = MARGIN;

    for (const card of summary) {
      // Fundo do card
      page.drawRectangle({
        x: cardX, y: y - cardH,
        width: cardW, height: cardH,
        color: LIGHT_GREY,
        borderColor: rgb(0.88, 0.90, 0.92),
        borderWidth: 0.5,
        borderOpacity: 1,
        opacity: 1,
      });

      // Label
      page.drawText(card.label, {
        x: cardX + 6, y: y - 14,
        size: 7, font: reg,
        color: GREY,
        maxWidth: cardW - 8,
      });

      // Valor
      const valColor = card.accent ? GREEN : DARK;
      page.drawText(card.value, {
        x: cardX + 6, y: y - 28,
        size: 10, font: bold,
        color: valColor,
        maxWidth: cardW - 8,
      });

      cardX += cardW + 8;
    }

    y -= cardH + 16;
  }

  // ── Tabela ────────────────────────────────────────────────────────────
  const totalColW = columns.reduce((s, c) => s + c.width, 0);
  const scaleX    = CONTENT_W / Math.max(totalColW, CONTENT_W);
  const scaledCols = columns.map((c) => ({ ...c, width: c.width * scaleX }));

  const rowH     = 16;
  const headerH  = 18;

  const drawTableHeader = () => {
    // Fundo do cabeçalho
    page.drawRectangle({
      x: MARGIN, y: y - headerH,
      width: CONTENT_W, height: headerH,
      color: GREEN,
    });

    let cx = MARGIN;
    for (const col of scaledCols) {
      page.drawText(col.header.toUpperCase(), {
        x: col.align === 'right' ? cx + col.width - reg.widthOfTextAtSize(col.header, 7) - 4 : cx + 4,
        y: y - 12,
        size: 7, font: bold, color: WHITE,
        maxWidth: col.width - 6,
      });
      cx += col.width;
    }
    y -= headerH;
  };

  ensureSpace(headerH + rowH * 2);
  drawTableHeader();

  if (rows.length === 0) {
    ensureSpace(rowH + 4);
    page.drawText('Nenhum registro encontrado.', {
      x: MARGIN + 4, y: y - 12,
      size: 9, font: reg, color: GREY,
    });
    y -= rowH;
  }

  for (let idx = 0; idx < rows.length; idx++) {
    ensureSpace(rowH + 2);

    // Se começou nova página, redesenhar cabeçalho da tabela
    if (idx > 0 && y === PAGE_H - 80) {
      drawTableHeader();
      ensureSpace(rowH + 2);
    }

    const row    = rows[idx];
    const bgColor = idx % 2 === 1 ? ROW_ALT_BG : WHITE;

    // Fundo da linha
    page.drawRectangle({
      x: MARGIN, y: y - rowH,
      width: CONTENT_W, height: rowH,
      color: bgColor,
    });

    // Separador inferior leve
    page.drawLine({
      start: { x: MARGIN,          y: y - rowH },
      end:   { x: PAGE_W - MARGIN, y: y - rowH },
      thickness: 0.3, color: rgb(0.92, 0.93, 0.94),
    });

    let cx = MARGIN;
    for (const col of scaledCols) {
      const val = row[col.key] ?? '—';
      const textW = reg.widthOfTextAtSize(val, 8);
      const tx = col.align === 'right'
        ? cx + col.width - Math.min(textW, col.width - 6) - 4
        : cx + 4;

      page.drawText(val, {
        x: tx, y: y - 11,
        size: 8, font: reg, color: DARK,
        maxWidth: col.width - 6,
      });
      cx += col.width;
    }

    y -= rowH;
  }

  // ── Rodapé última página ──────────────────────────────────────────────
  drawFooter(page, pageNum);

  return doc.save();
}
