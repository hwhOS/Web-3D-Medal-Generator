import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { defaultConfig } from '../domain/defaults';
import { useMedalStore } from '../store/useMedalStore';
import { ControlPanel } from './ControlPanel';

describe('ControlPanel', () => {
  afterEach(() => {
    act(() => {
      useMedalStore.getState().reset();
    });
  });

  it('renders primary controls and updates thickness', () => {
    render(<ControlPanel />);

    expect(screen.getByText('奖牌生成器')).toBeInTheDocument();
    const thickness = screen.getByLabelText(/厚度/i);
    fireEvent.change(thickness, { target: { value: '8' } });

    expect(useMedalStore.getState().config.thickness).toBe(8);
  });

  it('can reset state', () => {
    act(() => {
      useMedalStore.getState().setConfig({ thickness: 9 });
    });
    render(<ControlPanel />);

    fireEvent.click(screen.getByText('重置参数'));

    expect(useMedalStore.getState().config.thickness).toBe(defaultConfig.thickness);
  });
});
