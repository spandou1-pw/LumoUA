import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../src/components/Button';

describe('Button', () => {
  it('renders the label', () => {
    const { getByText } = render(<Button label="Увійти" onPress={() => {}} />);
    expect(getByText('Увійти')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<Button label="Увійти" onPress={onPress} />);
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<Button label="Увійти" onPress={onPress} disabled />);
    fireEvent.press(getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows a loading indicator instead of the label while loading, and blocks taps', () => {
    const onPress = jest.fn();
    const { queryByText, getByRole } = render(<Button label="Увійти" onPress={onPress} loading />);
    expect(queryByText('Увійти')).toBeNull();
    fireEvent.press(getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('exposes accessibility state reflecting disabled/busy', () => {
    const { getByRole } = render(<Button label="Увійти" onPress={() => {}} loading />);
    const button = getByRole('button');
    expect(button.props.accessibilityState).toMatchObject({ disabled: true, busy: true });
  });
});
