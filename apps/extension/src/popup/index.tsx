import React from 'react';
import { createRoot } from 'react-dom/client';
import { Popup } from './Popup';
import './style.css';

const container = document.getElementById('popup-root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}
