import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { defaultConfig } from '../domain/defaults';
import { useMedalStore } from '../store/useMedalStore';
import { ControlPanel } from './ControlPanel';

describe('ControlPanel', () => {
  afterEach(() => {
    act(() => {
      useMedalStore.getState().reset();
      useMedalStore.getState().setLanguage('en');
    });
  });

  it('renders primary controls and updates thickness', () => {
    render(<ControlPanel />);

    expect(screen.getByText('Medal Generator')).toBeInTheDocument();
    expect(screen.queryByText('Engrave')).not.toBeInTheDocument();
    expect(screen.getByText('Relief Color')).toBeInTheDocument();
    expect(screen.getByText('Text Roughness')).toBeInTheDocument();
    const thickness = screen.getByLabelText(/Thickness/i);
    fireEvent.change(thickness, { target: { value: '8' } });

    expect(useMedalStore.getState().config.thickness).toBe(8);
  });

  it('can switch the interface to Chinese', () => {
    render(<ControlPanel />);

    fireEvent.click(screen.getByText('中文'));

    expect(screen.getByText('奖牌生成器')).toBeInTheDocument();
    expect(screen.getByText('浮雕颜色')).toBeInTheDocument();
  });

  it('can reset state', () => {
    act(() => {
      useMedalStore.getState().setConfig({ thickness: 9 });
    });
    render(<ControlPanel />);

    fireEvent.click(screen.getByText('Reset Parameters'));

    expect(useMedalStore.getState().config.thickness).toBe(defaultConfig.thickness);
  });
});
