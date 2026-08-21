/* Coverage for the `injectIntl` shim: frontend-base no longer ships one, so
 * unlike the rest of `./i18n` this is our own implementation. */
import { Component, createRef, forwardRef, memo } from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from '@openedx/frontend-base';

import { injectIntl, WrappedComponentProps } from './i18n';

const messages = { greeting: 'Hello, {name}!' };

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <IntlProvider locale="en" messages={messages}>{ui}</IntlProvider>,
  );
}

describe('injectIntl', () => {
  it('passes an `intl` prop to a function component alongside its own props', () => {
    function Greeting({ intl, name }: WrappedComponentProps & { name: string }) {
      return <p>{intl.formatMessage({ id: 'greeting', description: 'Greets the user by name.' }, { name })}</p>;
    }
    const Wrapped = injectIntl(Greeting);

    renderWithIntl(<Wrapped name="Ada" />);

    expect(screen.getByText('Hello, Ada!')).toBeInTheDocument();
  });

  it('forwards refs to a class component instance', () => {
    class Counter extends Component<WrappedComponentProps> {
      locale() {
        return this.props.intl.locale;
      }

      render() {
        return <p>counter</p>;
      }
    }
    const Wrapped = injectIntl(Counter);
    const ref = createRef<Counter>();

    renderWithIntl(<Wrapped ref={ref} />);

    expect(ref.current).toBeInstanceOf(Counter);
    expect(ref.current?.locale()).toEqual('en');
  });

  it('forwards refs through a forwardRef component to the DOM node', () => {
    const Input = forwardRef<HTMLInputElement, WrappedComponentProps>(
      function Input({ intl }, ref) {
        return <input ref={ref} aria-label={intl.locale} />;
      },
    );
    const Wrapped = injectIntl(Input);
    const ref = createRef<HTMLInputElement>();

    renderWithIntl(<Wrapped ref={ref} />);

    expect(ref.current).toBe(screen.getByLabelText('en'));
  });

  it('keeps a memoized component memoized', () => {
    let renders = 0;
    const Memoized = memo(function Memoized({ intl }: WrappedComponentProps) {
      renders += 1;
      return <p>{intl.locale}</p>;
    });
    const Wrapped = injectIntl(Memoized);

    const { rerender } = renderWithIntl(<Wrapped />);
    rerender(
      <IntlProvider locale="en" messages={messages}><Wrapped /></IntlProvider>,
    );

    expect(renders).toEqual(1);
  });

  it('does not attach a ref when the caller passes none', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    function Plain({ intl }: WrappedComponentProps) {
      return <p>{intl.locale}</p>;
    }
    const Wrapped = injectIntl(Plain);

    renderWithIntl(<Wrapped />);

    /* React warns "Function components cannot be given refs" if we hand a ref
     * to a component that can't hold one. */
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('sets a displayName and exposes the wrapped component and its statics', () => {
    function Labelled({ intl }: WrappedComponentProps) {
      return <p>{intl.locale}</p>;
    }
    Labelled.displayName = 'Labelled';
    Labelled.someStatic = 'kept';

    const Wrapped = injectIntl(Labelled);

    expect(Wrapped.displayName).toEqual('injectIntl(Labelled)');
    expect(Wrapped.WrappedComponent).toBe(Labelled);
    expect((Wrapped as typeof Wrapped & { someStatic: string }).someStatic).toEqual('kept');
  });
});
