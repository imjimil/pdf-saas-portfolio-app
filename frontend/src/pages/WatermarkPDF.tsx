import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { ToolShell } from '../components/ToolShell';
import { Dropzone } from '../components/Dropzone';
import {
  NumberField,
  RangeField,
  SelectField,
  TextField,
  type SelectOption,
} from '../components/ui/Field';
import { Button } from '../components/ui/Button';
import { useToolRunner } from '../hooks/useToolRunner';
import { getTool } from '../lib/tools';
import { usePendingFiles } from '../hooks/usePendingFiles';
import { cn } from '../lib/cn';

const tool = getTool('watermark-pdf')!;

type Position =
  | 'center'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'tile';

const POSITIONS: ReadonlyArray<SelectOption<Position>> = [
  { value: 'center', label: 'Centre of the page' },
  { value: 'top-left', label: 'Top left' },
  { value: 'top-right', label: 'Top right' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'bottom-right', label: 'Bottom right' },
  { value: 'tile', label: 'Tiled across the page' },
];

/** Where the preview text sits, mirroring the server-side placement. */
const PREVIEW_ALIGNMENT: Record<Exclude<Position, 'tile'>, string> = {
  center: 'items-center justify-center',
  'top-left': 'items-start justify-start',
  'top-right': 'items-start justify-end',
  'bottom-left': 'items-end justify-start',
  'bottom-right': 'items-end justify-end',
};

export default function WatermarkPDF() {
  const [files, setFiles] = usePendingFiles();
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [position, setPosition] = useState<Position>('center');
  const [opacity, setOpacity] = useState(0.25);
  const [rotation, setRotation] = useState(-45);
  const [fontSize, setFontSize] = useState('');
  const { run, download, reset, running, progress, error, result } = useToolRunner();

  const trimmedText = watermarkText.trim();
  const parsedFontSize = Number(fontSize);
  const fontSizeValid = fontSize === '' || (parsedFontSize >= 8 && parsedFontSize <= 200);

  const pages = result ? Number(result.meta.pages) : 0;
  const previewText = trimmedText || 'Your text';

  return (
    <AppShell>
      <ToolShell
        tool={tool}
        action={{
          label: 'Add watermark',
          onClick: () =>
            run({
              endpoint: '/pdf/watermark',
              files,
              fields: {
                watermarkText: trimmedText,
                position,
                opacity,
                rotation,
                fontSize: fontSize === '' ? undefined : parsedFontSize,
              },
            }),
          disabled: !files.length || !trimmedText || !fontSizeValid,
          loading: running,
        }}
        progress={progress}
        error={error}
        result={
          result
            ? {
                title: 'Watermark applied',
                detail: pages
                  ? `Marked ${pages} ${pages === 1 ? 'page' : 'pages'} with "${trimmedText}".`
                  : `Every page now carries "${trimmedText}".`,
                downloadLabel: 'Download PDF',
                onDownload: download,
                onReset: () => {
                  reset();
                  setFiles([]);
                },
              }
            : null
        }
      >
        <Dropzone accept={tool.accept} files={files} onChange={setFiles} />

        <div className="card space-y-4 p-4 sm:p-5">
          <TextField
            label="Watermark text"
            value={watermarkText}
            onChange={setWatermarkText}
            placeholder="CONFIDENTIAL"
            maxLength={120}
            autoComplete="off"
            helper="Up to 120 characters, stamped on every page."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Position"
              value={position}
              onChange={setPosition}
              options={POSITIONS}
            />
            <NumberField
              label="Text size"
              value={fontSize}
              onChange={setFontSize}
              min={8}
              max={200}
              step={1}
              placeholder="Automatic"
              helper="Leave blank to scale it to the page."
              error={fontSizeValid ? undefined : 'Choose a size between 8 and 200.'}
            />
          </div>

          <RangeField
            label="Opacity"
            value={opacity}
            onChange={setOpacity}
            min={0.05}
            max={1}
            step={0.05}
            format={(value) => `${Math.round(value * 100)}%`}
            helper="Lower values sit behind your content; higher values sit boldly on top."
          />

          <div className="space-y-2">
            <RangeField
              label="Rotation"
              value={rotation}
              onChange={setRotation}
              min={-90}
              max={90}
              step={1}
              format={(value) => `${value}°`}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant={rotation === -45 ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setRotation(-45)}
              >
                Diagonal
              </Button>
              <Button
                variant={rotation === 0 ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setRotation(0)}
              >
                Horizontal
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[13.5px] font-medium text-ink-soft dark:text-sand-200">
              Preview
            </p>
            <div
              aria-hidden
              className={cn(
                'relative flex h-32 overflow-hidden rounded-xl border hairline bg-white p-3 dark:bg-white/[0.02]',
                position === 'tile'
                  ? 'items-center justify-center'
                  : PREVIEW_ALIGNMENT[position]
              )}
            >
              {position === 'tile' ? (
                <div className="grid w-full grid-cols-2 place-items-center gap-2">
                  {[0, 1, 2, 3].map((index) => (
                    <span
                      key={index}
                      className="select-none truncate text-[13px] font-semibold text-ink dark:text-sand-100"
                      style={{ opacity, transform: `rotate(${rotation}deg)` }}
                    >
                      {previewText}
                    </span>
                  ))}
                </div>
              ) : (
                <span
                  className="max-w-full select-none truncate text-[20px] font-semibold text-ink dark:text-sand-100"
                  style={{ opacity, transform: `rotate(${rotation}deg)` }}
                >
                  {previewText}
                </span>
              )}
            </div>
            <p className="text-[12.5px] text-muted">
              An approximation — the real stamp scales to your page size.
            </p>
          </div>
        </div>
      </ToolShell>
    </AppShell>
  );
}
