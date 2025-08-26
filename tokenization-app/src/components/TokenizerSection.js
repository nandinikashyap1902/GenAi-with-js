import React, { useState, useMemo } from 'react';
import { Tiktoken } from 'js-tiktoken/lite';
import o200k_base from 'js-tiktoken/ranks/o200k_base';

const TokenizerSection = () => {
  const [inputText, setInputText] = useState('');
  const [tokens, setTokens] = useState([]);
  const [tokenInput, setTokenInput] = useState('');
  const [decodedText, setDecodedText] = useState('');
  const [copied, setCopied] = useState(false);

  // Memoize Tiktoken instance to prevent recreation on every render
  const enc = useMemo(() => new Tiktoken(o200k_base), []);

  const handleEncode = () => {
    try {
      const encodedTokens = enc.encode(inputText);
      setTokens(encodedTokens);
    } catch (error) {
      console.error('Encoding error:', error);
    }
  };

  const handleDecode = () => {
    try {
     
      
      // Clean the input - remove brackets, extra spaces, and other formatting
      const cleanInput = tokenInput
        .replace(/^\[|\]$/g, '') // Remove leading [ and trailing ]
        .replace(/[^\d,\s-]/g, '') // Keep only digits, commas, spaces, and negative signs
        .trim();
      
      const tokenArray = cleanInput
        .split(',')
        .map(token => parseInt(token.trim()))
        .filter(token => !isNaN(token)); // Remove any NaN values
      
      if (tokenArray.length === 0) {
        setDecodedText('Error: No valid tokens found');
        return;
      }
      
      const decoded = enc.decode(tokenArray);
      
      setDecodedText(decoded);
    } catch (error) {
      console.error('Decoding error:', error);
      setDecodedText('Error: Invalid token format');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tokenizer-section">
      <div className="section-header">
        <h2>🔤 Text Tokenization</h2>
        <p>Convert text to tokens and vice versa using js-tiktoken</p>
      </div>

      <div className="tokenizer-grid">
        {/* Encoding Section */}
        <div className="encode-section">
          <h3>📝 Encode Text to Tokens</h3>
          <div className="input-group">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text to tokenize..."
              className="text-input"
              rows={3}
            />
            <button onClick={handleEncode} className="encode-btn">
              Encode
            </button>
          </div>
          
          {tokens.length > 0 && (
            <div className="result-box">
              <div className="result-header">
                <span className="token-count">Tokens: {tokens.length}</span>
                <button 
                  onClick={() => copyToClipboard(JSON.stringify(tokens))}
                  className="copy-btn"
                >
                  {copied ? '✅' : '📋'}
                </button>
              </div>
              <div className="tokens-display">
                {tokens.map((token, index) => (
                  <span key={index} className="token">
                    {token}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Decoding Section */}
        <div className="decode-section">
          <h3>🔢 Decode Tokens to Text</h3>
          <div className="input-group">
            <textarea
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Enter comma-separated tokens..."
              className="text-input"
              rows={3}
            />
            <button onClick={handleDecode} className="decode-btn">
              Decode
            </button>
          </div>
          
          {decodedText && (
            <div className="result-box">
              <div className="result-header">
                <span>Decoded Text:</span>
                <button 
                  onClick={() => copyToClipboard(decodedText)}
                  className="copy-btn"
                >
                  {copied ? '✅' : '📋'}
                </button>
              </div>
              <div className="decoded-text">
                {decodedText}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenizerSection;