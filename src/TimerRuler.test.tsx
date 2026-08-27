import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { getTimerThresholds } from './ratingData';
import TimerRuler from './TimerRuler';

const thresholds = getTimerThresholds(1_800_000);

const timingCases = [
  { clearTime: 900_000, status: 'plus3', detail: 'Maximum score' },
  { clearTime: 1_260_000, status: 'plus2', detail: '3:00 to +3' },
  { clearTime: 1_620_000, status: 'timed', detail: '3:00 to +2' },
  { clearTime: 2_160_000, status: 'overtime', detail: '6:00 to no score' },
  { clearTime: 2_700_000, status: 'no-score', detail: '3:00 past final timer' },
] as const;

describe('TimerRuler', () => {
  test.each(timingCases)('classifies a run in the $status range', ({clearTime, status, detail}) => {
    const {container} = render(<TimerRuler clearTime={clearTime} thresholds={thresholds} />);

    expect(container.querySelector('.runProgress')).toHaveAttribute('data-status', status);
    expect(screen.getByText(detail)).toBeInTheDocument();
  });

  test('places the marker using the final timer as the ruler endpoint', () => {
    const clearTime = 1_260_000;
    const {container} = render(<TimerRuler clearTime={clearTime} thresholds={thresholds} />);
    const marker = container.querySelector('.timerRulerMarker');

    expect(marker).toHaveStyle({left: `${(clearTime / thresholds.fail) * 100}%`});
    expect(screen.getByText('18:00')).toBeInTheDocument();
    expect(screen.getByText('24:00')).toBeInTheDocument();
    expect(screen.getByText('30:00')).toBeInTheDocument();
    expect(screen.getByText('42:00')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAccessibleName(/Best run 21:00, \+2/);
  });

  test('leaves the marker out when a dungeon has no recorded run', () => {
    const {container} = render(<TimerRuler clearTime={null} thresholds={thresholds} />);

    expect(container.querySelector('.timerRulerMarker')).toBeNull();
    expect(screen.getByRole('img')).toHaveAccessibleName(/No best run recorded/);
    expect(screen.getByText('No recorded best run')).toBeInTheDocument();
  });
});
