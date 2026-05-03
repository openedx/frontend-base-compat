import { render } from '@testing-library/react';
import Plugin from './Plugin';

describe('FPF Plugin stub', () => {
  it('renders its children', () => {
    const { getByText } = render(<Plugin><span>child</span></Plugin>);
    expect(getByText('child')).toBeInTheDocument();
  });
});
