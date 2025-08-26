import React, { useState, useMemo } from 'react';

const EmbeddingsSection = () => {
  const [inputText, setInputText] = useState('');
  const [embedding, setEmbedding] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const ollamaModel = 'nomic-embed-text'; // Fixed model - no longer configurable

  // Memoize Ollama API configuration to prevent recreation on every render
  const ollamaConfig = useMemo(() => ({
    baseUrl: 'http://localhost:11434',
    defaultModel: 'nomic-embed-text'
  }), []);

  // Check if Ollama server is running
  const checkOllamaStatus = async () => {
    try {
      const response = await fetch(`${ollamaConfig.baseUrl}/api/tags`);
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const generateEmbedding = async () => {
    setLoading(true);
    setError('');
    setEmbedding(null); // Clear previous embedding
    
    console.log('🔍 Generating embedding for text:', inputText);
    console.log('🤖 Using model:', ollamaModel);
    
    try {
      // Check if Ollama server is running
      const isOllamaRunning = await checkOllamaStatus();
      if (!isOllamaRunning) {
        setError('❌ Ollama server not running. Please start Ollama server: ollama serve');
        setLoading(false);
        return;
      }

      const requestBody = {
        model: ollamaModel,
        prompt: inputText
      };
      
      console.log('📤 Request body:', requestBody);

      // Generate embedding using Ollama API
      const response = await fetch(`${ollamaConfig.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Response Error:', response.status, errorText);
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📥 API Response:', result);
      
      // Format result to match expected structure
      setEmbedding({
        embedding: result.embedding,
        index: 0,
        object: 'embedding'
      });

    } catch (err) {
      console.error('Error creating embedding:', err);
      
      if (err.message.includes('Failed to fetch') || err.message.includes('connection')) {
        setError('🔌 Connection failed. Ensure Ollama server is running on http://localhost:11434');
      } else if (err.message.includes('404')) {
        setError(`📦 Model '${ollamaModel}' not found. Install it with: ollama pull ${ollamaModel}`);
      } else {
        setError(`❌ Error: ${err.message || 'Failed to generate embedding'}`);
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
        <h2>🧠 Ollama Embeddings</h2>
        <p>Generate vector embeddings for text using Ollama's local embedding models</p>
      </div>

      <div className="embeddings-container">
        <div className="input-section">
          <h3>📄 Input Text</h3>
          <div className="model-info">
            <span className="model-label">🤖 Embedding Model:</span>
            <span className="model-name">nomic-embed-text</span>
          </div>
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
                    <span className="stat-value">{ollamaModel}</span>
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