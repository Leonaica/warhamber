import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CharacterProvider } from './context/CharacterContext';
import { GameStateProvider } from './context/GameStateContext';
import { Layout } from './components/Layout';
import { AvatarBuilderPage } from './pages/AvatarBuilderPage';
import { PlaysheetPage } from './pages/PlaysheetPage';
import { ResolverPage } from './pages/ResolverPage';
import { CombatPage } from './pages/CombatPage';

function App() {
  return (
    <CharacterProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
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
      </BrowserRouter>
    </CharacterProvider>
  );
}

export default App;