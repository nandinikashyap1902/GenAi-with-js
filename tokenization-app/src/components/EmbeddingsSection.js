import React, { useState } from 'react';
import { OpenAI } from 'openai';

const EmbeddingsSection = () => {
  const [inputText, setInputText] = useState('I love to visit India');
  const [embedding, setEmbedding] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const client = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
  });

  // Generate mock embedding for demonstration when API limit is reached
  const generateMockEmbedding = (text) => {
    // Create a deterministic but realistic-looking embedding based on text
    const embedding = [];
    const textHash = text.split('').reduce((hash, char) => {
      return ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff;
    }, 0);
    
    // Generate 3072 dimensions (same as text-embedding-3-large)
    for (let i = 0; i < 3072; i++) {
      const seed = textHash + i;
      const value = (Math.sin(seed * 0.01) + Math.cos(seed * 0.02)) * 0.5;
      embedding.push(value);
    }
    
    return {
      embedding: embedding,
      index: 0,
      object: 'embedding'
    };
  };

  const generateEmbedding = async () => {
    if (!process.env.REACT_APP_OPENAI_API_KEY) {
      setError('OpenAI API key not found. Please add REACT_APP_OPENAI_API_KEY to your .env file.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const result = await client.embeddings.create({
        model: 'text-embedding-3-large',
        input: inputText,
        encoding_format: 'float',
      });

      setEmbedding(result.data[0]);
    } catch (err) {
      console.error('Error creating embedding:', err);
      
      // Check if it's a quota/limit error and offer mock embedding
      if (err.message && (err.message.includes('quota') || err.message.includes('limit') || err.message.includes('insufficient'))) {
        setError(`API limit reached. Using mock embedding for demonstration. Error: ${err.message}`);
        
        // Generate mock embedding after a short delay to simulate API call
        setTimeout(() => {
          const mockResult = generateMockEmbedding(inputText);
          setEmbedding(mockResult);
          setError('⚠️ Using mock embedding (API limit reached). Functionality demonstration only.');
        }, 1000);
      } else {
        setError(`Error: ${err.message || 'Failed to generate embedding'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatEmbedding = (embeddingArray) => {
    return embeddingArray.slice(0, 10).map(val => val.toFixed(6)).join(', ') + '...';
  };

  return (
    <div className="embeddings-section">
      <div className="section-header">
        <h2>🧠 OpenAI Embeddings</h2>
        <p>Generate vector embeddings for text using OpenAI's text-embedding-3-large model</p>
      </div>

      <div className="embeddings-container">
        <div className="input-section">
          <h3>📄 Input Text</h3>
          <div className="input-group">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text to generate embeddings..."
              className="text-input"
              rows={4}
            />
            <button 
              onClick={generateEmbedding} 
              className="generate-btn"
              disabled={loading || !inputText.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Generating...
                </>
              ) : (
                '🚀 Generate Embedding'
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-box">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {embedding && (
          <div className="results-section">
            <div className="embedding-stats">
              <div className="stat-card">
                <h4>📊 Embedding Stats</h4>
                <div className="stats-grid">
                  <div className="stat">
                    <span className="stat-label">Dimensions:</span>
                    <span className="stat-value">{embedding.embedding.length}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Model:</span>
                    <span className="stat-value">text-embedding-3-large</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Input Length:</span>
                    <span className="stat-value">{inputText.length} chars</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="embedding-preview">
              <div className="result-header">
                <h4>🔍 Embedding Preview (first 10 values)</h4>
                <button 
                  onClick={() => copyToClipboard(JSON.stringify(embedding.embedding))}
                  className="copy-btn"
                >
                  {copied ? '✅' : '📋'} Copy Full Vector
                </button>
              </div>
              <div className="embedding-values">
                <code>{formatEmbedding(embedding.embedding)}</code>
              </div>
            </div>

            <div className="embedding-visualization">
              <h4>📈 Vector Visualization</h4>
              <div className="vector-bars">
                {embedding.embedding.slice(0, 50).map((value, index) => (
                  <div 
                    key={index} 
                    className="vector-bar"
                    style={{
                      height: `${Math.abs(value) * 100}px`,
                      backgroundColor: value >= 0 ? '#4CAF50' : '#FF5722'
                    }}
                    title={`Index ${index}: ${value.toFixed(6)}`}
                  ></div>
                ))}
              </div>
              <p className="viz-note">Showing first 50 dimensions (green: positive, red: negative)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmbeddingsSection;