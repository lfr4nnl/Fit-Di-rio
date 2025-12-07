import React from 'react';
import { createRoot } from 'react-dom/client';
import TreinoDiarioApp from './TreinoDiarioApp';

import './index.css';

const root = createRoot(document.getElementById('root'));
root.render(<TreinoDiarioApp />);
