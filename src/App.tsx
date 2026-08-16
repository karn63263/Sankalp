import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Verify from './pages/Verify';
import { loadState, saveState } from './store/store';
import type { AppState } from './store/store';
import templateImage from './imports/h.png';

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const loaded = loadState();
    // Auto-set h.png as the appreciation template if none has been uploaded yet
    if (!loaded.templateAppreciation.url) {
      return {
        ...loaded,
        templateAppreciation: {
          ...loaded.templateAppreciation,
          url: templateImage,
          templateType: 'image',
        },
      };
    }
    return loaded;
  });

  // Persist the auto-set template on first load
  useEffect(() => {
    saveState(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setAndSave = (s: AppState) => {
    setState(s);
    saveState(s);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home state={state} setState={setAndSave} />} />
        <Route path="/admin" element={<Admin state={state} setState={setAndSave} />} />
        <Route path="/verify/:id" element={<Verify state={state} />} />
      </Routes>
    </BrowserRouter>
  );
}
