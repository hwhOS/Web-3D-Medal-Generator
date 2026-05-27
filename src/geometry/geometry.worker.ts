import wasmUrl from 'manifold-3d/manifold.wasm?url';
import type { WorkerBuildRequest, WorkerBuildResponse } from '../domain/types';

const ctx: DedicatedWorkerGlobalScope = self as DedicatedWorkerGlobalScope;

ctx.onmessage = async (event: MessageEvent<WorkerBuildRequest>) => {
  const { id, config, svg } = event.data;

  try {
    const { buildMedalModel } = await import('./medalBuilder');
    const model = await buildMedalModel(config, svg, wasmUrl);
    const response: WorkerBuildResponse = {
      id,
      ok: true,
      model
    };

    ctx.postMessage(response, [model.positions.buffer, model.indices.buffer]);
  } catch (error) {
    const response: WorkerBuildResponse = {
      id,
      ok: false,
      error: error instanceof Error ? error.message : '模型生成失败。',
      warnings: []
    };
    ctx.postMessage(response);
  }
};
