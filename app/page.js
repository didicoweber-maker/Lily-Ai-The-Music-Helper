'use client';

import { useState } from 'react';
import './globals.css';

export default function Home() {
  const [activePage, setActivePage] = useState('enhancer');
  const [lyricsInput, setLyricsInput] = useState('');
  const [rhymeInput, setRhymeInput] = useState('');
  const [selectedMood, setSelectedMood] = useState('heartbreak');
  const [selectedStyles, setSelectedStyles] = useState(['emotional']);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [rhymeResults, setRhymeResults] = useState(null);
  const [ideaResults, setIdeaResults] = useState(null);

  const styles = ['emotional', 'simple', 'metaphor', 'complex'];
  const moods = ['heartbreak', 'celebration', 'nostalgia', 'rebellion', 'peace', 'wonder'];
  const moodLabels = { heartbreak: 'heartbreak', celebration: 'joy', nostalgia: 'memories', rebellion: 'defiance', peace: 'peace', wonder: 'wonder' };

  const toggleStyle = (style) => {
    setSelectedStyles(prev => prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]);
  };

  const callAPI = async (prompt, system = '', service = 'default') => {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, system, service })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.result || 'No response generated.';
  };

  const handleEnhance = async () => {
    if (loading || !lyricsInput.trim()) return;
    setLoading(true);
    setOutput('');
    try {
      const styleText = selectedStyles.length ? 'Style: ' + selectedStyles.join(', ') + '. ' : '';
      const result = await callAPI(
        styleText + 'Enhance these lyrics, keep the same length and format:\n\n' + lyricsInput,
        'You are an expert songwriter. Make lyrics more powerful while keeping rhythm and meaning.',
        'enhancer'
      );
      setOutput(result);
    } catch (err) {
      setOutput('Error: ' + err.message);
    }
    setLoading(false);
  };

  const handleRhyme = async () => {
    if (loading || !rhymeInput.trim()) return;
    setLoading(true);
    setRhymeResults(null);
    try {
      const result = await callAPI(
        'Find rhymes for "' + rhymeInput + '". Format:\nPERFECT: ...\nNEAR: ...\nASSONANCE: ...',
        'You are a poetry expert. Give creative rhyming words.',
        'rhyme'
      );
      const lines = result.split('\n');
      let perfect = [], near = [], assonance = [];
      lines.forEach(l => {
        if (l.startsWith('PERFECT:')) perfect = l.substring(8).split(/[,\s]+/).filter(w => w);
        if (l.startsWith('NEAR:')) near = l.substring(5).split(/[,\s]+/).filter(w => w);
        if (l.startsWith('ASSONANCE:')) assonance = l.substring(10).split(/[,\s]+/).filter(w => w);
      });
      setRhymeResults({ perfect, near, assonance });
    } catch (err) {
      setRhymeResults({ error: err.message });
    }
    setLoading(false);
  };

  const handleIdea = async () => {
    if (loading) return;
    setLoading(true);
    setIdeaResults(null);
    try {
      const result = await callAPI(
        'Song ideas about ' + moodLabels[selectedMood] + '. Format:\nTITLES: ...\nTHEME: ...\nHOOK: ...',
        'You are a songwriting partner. Be creative and inspiring.',
        'idea'
      );
      const sections = result.split(/TITLES:|THEME:|HOOK:/i);
      setIdeaResults({
        titles: sections[1]?.trim() || 'Creative Title',
        theme: sections[2]?.trim() || 'A song about ' + moodLabels[selectedMood],
        hook: sections[3]?.trim() || 'When the music plays...'
      });
    } catch (err) {
      setIdeaResults({ error: err.message });
    }
    setLoading(false);
  };

  const copyOutput = (text) => navigator.clipboard.writeText(text);

  return (
    <main>
      <nav className="nav">
        <div className="logo"><span className="logo-text">Lily AI</span></div>
        <div className="nav-links">
          <button className={`nav-btn ${activePage === 'enhancer' ? 'active' : ''}`} onClick={() => setActivePage('enhancer')}>Lyric Enhancer</button>
          <button className={`nav-btn ${activePage === 'rhyme' ? 'active' : ''}`} onClick={() => setActivePage('rhyme')}>Rhyme Finder</button>
          <button className={`nav-btn ${activePage === 'idea' ? 'active' : ''}`} onClick={() => setActivePage('idea')}>Idea Generator</button>
        </div>
      </nav>

      <div className="container">
        {activePage === 'enhancer' && (
          <section className="page active">
            <div className="page-header">
              <div className="page-icon blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div>
              <h1 className="page-title blue">Lyric Enhancer</h1>
              <p className="page-desc">Transform your rough lyrics into polished verses</p>
            </div>
            <div className="input-section">
              <label className="input-label">Your Lyrics</label>
              <textarea className="textarea" value={lyricsInput} onChange={(e) => setLyricsInput(e.target.value)} placeholder="Paste your lyrics here..." />
            </div>
            <div className="chips">
              {styles.map(s => (
                <button key={s} className={`chip blue ${selectedStyles.includes(s) ? 'selected' : ''}`} onClick={() => toggleStyle(s)}>
                  {s === 'emotional' ? 'More Emotional' : s === 'simple' ? 'Simpler' : s === 'metaphor' ? 'Add Metaphors' : 'More Complex'}
                </button>
              ))}
            </div>
            <button className="btn-generate blue" onClick={handleEnhance} disabled={loading}>
              {loading ? 'Enhancing...' : 'Enhance Lyrics'}
            </button>
            {output && (
              <div className="output-section visible">
                <div className="output-card blue">
                  <div className="output-header"><span className="output-label">Enhanced Lyrics</span><button className="copy-btn" onClick={() => copyOutput(output)}>Copy</button></div>
                  <div className="output-text">{output}</div>
                </div>
              </div>
            )}
          </section>
        )}

        {activePage === 'rhyme' && (
          <section className="page active">
            <div className="page-header">
              <div className="page-icon green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
              <h1 className="page-title green">Rhyme Finder</h1>
              <p className="page-desc">Find rhymes using AI</p>
            </div>
            <div className="input-section">
              <label className="input-label">Enter a word</label>
              <input type="text" className="textarea" style={{height: '60px'}} value={rhymeInput} onChange={(e) => setRhymeInput(e.target.value)} placeholder="Type a word..." />
            </div>
            <button className="btn-generate green" onClick={handleRhyme} disabled={loading}>
              {loading ? 'Finding...' : 'Find Rhymes'}
            </button>
            {rhymeResults && (
              <div className="output-section visible">
                <div className="output-card green">
                  {rhymeResults.error ? <p>{rhymeResults.error}</p> : (
                    <div className="rhyme-grid">
                      <div className="rhyme-category">
                        <div className="rhyme-category-title"><span className="dot perfect"></span>Perfect</div>
                        <div className="rhyme-list">{rhymeResults.perfect.map((w, i) => <span key={i} className="rhyme-word">{w}</span>)}</div>
                      </div>
                      <div className="rhyme-category">
                        <div className="rhyme-category-title"><span className="dot near"></span>Near</div>
                        <div className="rhyme-list">{rhymeResults.near.map((w, i) => <span key={i} className="rhyme-word">{w}</span>)}</div>
                      </div>
                      <div className="rhyme-category">
                        <div className="rhyme-category-title"><span className="dot assonance"></span>Assonance</div>
                        <div className="rhyme-list">{rhymeResults.assonance.map((w, i) => <span key={i} className="rhyme-word">{w}</span>)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {activePage === 'idea' && (
          <section className="page active">
            <div className="page-header">
              <div className="page-icon amber"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg></div>
              <h1 className="page-title amber">Idea Generator</h1>
              <p className="page-desc">Get inspired with themes and hooks</p>
            </div>
            <div className="chips">
              {moods.map(m => (
                <button key={m} className={`chip amber ${selectedMood === m ? 'selected' : ''}`} onClick={() => setSelectedMood(m)}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
            <button className="btn-generate amber" onClick={handleIdea} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Ideas'}
            </button>
            {ideaResults && (
              <div className="output-section visible">
                {ideaResults.error ? <div className="output-card amber"><p>{ideaResults.error}</p></div> : (
                  <div className="idea-cards">
                    <div className="idea-card"><div className="idea-card-label">Titles</div><div className="idea-card-title">{ideaResults.titles}</div></div>
                    <div className="idea-card"><div className="idea-card-label">Theme</div><div className="idea-card-text">{ideaResults.theme}</div></div>
                    <div className="idea-card"><div className="idea-card-label">Hook</div><div className="idea-card-text">{ideaResults.hook}</div></div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      <footer className="footer"><p>Lily AI — Free AI Songwriting Assistant</p></footer>
    </main>
  );
}
