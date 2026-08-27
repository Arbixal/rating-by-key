import { render, screen } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import App from './App';

test('renders the app header', () => {
  const router = createMemoryRouter(
    [{ path: '/', element: <App /> }],
    { initialEntries: ['/'] }
  );
  render(<RouterProvider router={router} />);
  const headerElement = screen.getByText(/rating by key/i);
  expect(headerElement).toBeInTheDocument();
});
