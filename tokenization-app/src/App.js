import React, { useState } from 'react';
import './App.css';
import TokenizerSection from './components/TokenizerSection';
import EmbeddingsSection from './components/EmbeddingsSection';

function App() {
  const [activeTab, setActiveTab] = useState('tokenizer');

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>🤖 AI Text Processing Lab</h1>
          <p>Explore tokenization and embeddings with js-tiktoken and OpenAI</p>
        </div>
      </header>

      <nav className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'tokenizer' ? 'active' : ''}`}
          onClick={() => setActiveTab('tokenizer')}
        >
          🔤 Tokenization
        </button>
        <button 
          className={`tab-btn ${activeTab === 'embeddings' ? 'active' : ''}`}
          onClick={() => setActiveTab('embeddings')}
        >
          🧠 Embeddings
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'tokenizer' && <TokenizerSection />}
        {activeTab === 'embeddings' && <EmbeddingsSection />}
      </main>

      <footer className="app-footer">
        <p>Built with React.js • js-tiktoken • OpenAI API</p>
      </footer>
    </div>
  );
}

export default App;
