import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import LLMs from './pages/LLMs';
import EmbeddingModels from './pages/EmbeddingModels';
import Agents from './pages/Agents';
import KnowledgeBases from './pages/KnowledgeBases';
import './index.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/llms" element={<LLMs />} />
          <Route path="/embeddings" element={<EmbeddingModels />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/knowledge" element={<KnowledgeBases />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
