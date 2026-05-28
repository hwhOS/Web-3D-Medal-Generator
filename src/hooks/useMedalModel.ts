import { useEffect, useRef, useState } from 'react';
import type {
  BuildStatus,
  MedalConfig,
  ModelBuffers,
  SvgReliefGeometry,
  SvgReliefInput,
  WorkerBuildResponse
} from '../domain/types';
import { parseSvgToPolygons } from '../geometry/svgParser';

export interface MedalModelState {
  status: BuildStatus;
  model: ModelBuffers | null;
  error: string | null;
}

function parseSvgInput(svg: SvgReliefInput | null, config: MedalConfig): SvgReliefGeometry | null {
  if (!svg) {
    return null;
  }

  const parsed = parseSvgToPolygons(svg.text, {
    curveSegments: Math.max(8, Math.round(config.quality / 6))
  });

  return {
    fileName: svg.fileName,
    polygons: parsed.polygons,
    warnings: parsed.warnings
  };
}

export function useMedalModel(config: MedalConfig, svg: SvgReliefInput | null, backSvg: SvgReliefInput | null): MedalModelState {
  const workerRef = useRef<Worker | null>(null);
  const requestId = useRef(0);
  const [state, setState] = useState<MedalModelState>({
    status: 'idle',
    model: null,
    error: null
  });

  useEffect(() => {
    const worker = new Worker(new URL('../geometry/geometry.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    return () => {
      worker.terminate();
      if (workerRef.current === worker) {
        workerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) {
      return;
    }

    const id = requestId.current + 1;
    requestId.current = id;

    let parsedSvg: SvgReliefGeometry | null = null;
    let parsedBackSvg: SvgReliefGeometry | null = null;
    try {
      parsedSvg = parseSvgInput(svg, config);
      parsedBackSvg = parseSvgInput(backSvg, config);
    } catch (error) {
      setState({
        status: 'error',
        model: null,
        error: error instanceof Error ? `SVG 解析失败：${error.message}` : 'SVG 解析失败。'
      });
      return;
    }

    setState((current) => ({
      status: 'generating',
      model: current.model,
      error: null
    }));

    const timeout = window.setTimeout(() => {
      worker.postMessage({ id, config, svg: parsedSvg, backSvg: parsedBackSvg });
    }, 180);

    const watchdog = window.setTimeout(() => {
      if (id === requestId.current) {
        setState({
          status: 'error',
          model: null,
          error: '模型生成超时，请降低曲线精度或简化 SVG 后重试。'
        });
      }
    }, 15000);

    const handleMessage = (event: MessageEvent<WorkerBuildResponse>) => {
      if (event.data.id !== requestId.current) {
        return;
      }

      window.clearTimeout(watchdog);
      if (event.data.ok) {
        setState({
          status: 'ready',
          model: event.data.model,
          error: null
        });
      } else {
        setState({
          status: 'error',
          model: null,
          error: event.data.error
        });
      }
    };

    const handleError = (event: ErrorEvent) => {
      if (id !== requestId.current) {
        return;
      }

      window.clearTimeout(watchdog);
      setState({
        status: 'error',
        model: null,
        error: event.message || '模型生成 worker 出错。'
      });
    };

    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);

    return () => {
      window.clearTimeout(timeout);
      window.clearTimeout(watchdog);
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
    };
  }, [config, svg, backSvg]);

  return state;
}
