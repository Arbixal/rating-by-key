import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';
import App from './app/App';
import ErrorBoundary from './shared/ui/ErrorBoundary';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />
  },
  {
    path: "/:region/:realm/:character",
    element: <App />
  },
])

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </React.StrictMode>
);
