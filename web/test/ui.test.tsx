import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button, ErrorState, EmptyState } from '../src/components/ui';

describe('Button', () => {
  it('renders the label and responds to click', () => {
    const onClick = jest.fn();
    render(<Button label="Увійти" onClick={onClick} />);
    fireEvent.click(screen.getByText('Увійти'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled and unclickable while loading', () => {
    const onClick = jest.fn();
    render(<Button label="Увійти" onClick={onClick} loading />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('does not fire onClick when disabled', () => {
    const onClick = jest.fn();
    render(<Button label="Увійти" onClick={onClick} disabled />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('ErrorState', () => {
  it('shows the message with role="alert" and fires onRetry', () => {
    const onRetry = jest.fn();
    render(<ErrorState message="Помилка мережі" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Помилка мережі');
    fireEvent.click(screen.getByText('Спробувати ще раз'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('omits the retry button when onRetry is not provided', () => {
    render(<ErrorState message="Доступ заборонено" />);
    expect(screen.queryByText('Спробувати ще раз')).not.toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('renders the action and fires it on click', () => {
    const onAction = jest.fn();
    render(<EmptyState title="Порожньо" message="Нічого немає" actionLabel="Дія" onAction={onAction} />);
    fireEvent.click(screen.getByText('Дія'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
