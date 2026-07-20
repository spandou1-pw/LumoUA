import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorState, EmptyState } from '../src/components/StateViews';

describe('ErrorState', () => {
  it('renders the message and calls onRetry when the retry button is pressed', () => {
    const onRetry = jest.fn();
    const { getByText } = render(<ErrorState message="Не вдалося завантажити." onRetry={onRetry} />);

    expect(getByText('Не вдалося завантажити.')).toBeTruthy();
    fireEvent.press(getByText('Спробувати ще раз'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders without a retry button when onRetry is omitted (doc: message alone must explain what to do)', () => {
    const { queryByText } = render(<ErrorState message="Доступ заборонено." />);
    expect(queryByText('Спробувати ще раз')).toBeNull();
  });
});

describe('EmptyState', () => {
  it('renders title/message without an action when none is provided', () => {
    const { getByText, queryByText } = render(<EmptyState title="Порожньо" message="Нічого тут немає." />);
    expect(getByText('Порожньо')).toBeTruthy();
    expect(getByText('Нічого тут немає.')).toBeTruthy();
  });

  it('renders and fires the action when both actionLabel and onAction are provided (doc 08: never a dead end)', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <EmptyState title="Порожньо" message="Підпишіться на когось." actionLabel="Знайти людей" onAction={onAction} />,
    );
    fireEvent.press(getByText('Знайти людей'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
