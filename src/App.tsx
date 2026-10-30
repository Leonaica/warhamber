import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CharacterProvider } from './context/CharacterProvider';
import { GameStateProvider } from './context/GameStateProvider';
import { Layout } from './components/Layout';
import { lazy, Suspense } from 'react';

const AvatarBuilderPage = lazy(() =>
  import('./pages/AvatarBuilderPage').then(m => ({ default: m.AvatarBuilderPage })));
const PlaysheetPage = lazy(() =>
  import('./pages/PlaysheetPage').then(m => ({ default: m.PlaysheetPage })));
const ResolverPage = lazy(() =>
  import('./pages/ResolverPage').then(m => ({ default: m.ResolverPage })));
const CombatPage = lazy(() =>
  import('./pages/CombatPage').then(m => ({ default: m.CombatPage })));

function App() {
  return (
    <CharacterProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8 text-slate-500 text-sm">Loading…</div>}>
        <Routes>
          <Route path="/" element={<Layout><AvatarBuilderPage /></Layout>} />
          <Route path="/playsheet" element={
            <GameStateProvider>
              <Layout><PlaysheetPage /></Layout>
            </GameStateProvider>
          } />
          <Route path="/resolver" element={
            <GameStateProvider>
              <Layout><ResolverPage /></Layout>
            </GameStateProvider>
          } />
          <Route path="/combat" element={
            <GameStateProvider>
              <Layout><CombatPage /></Layout>
            </GameStateProvider>
          } />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </CharacterProvider>
  );
}

export default App;