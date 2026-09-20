import { useState } from 'react';
import { componentMention } from './componentMention.js';
import './CircuitChat.css';

const welcome = {
  role: 'assistant',
  text: 'Hi! I’m Watt, your circuit helper. Ask me about batteries, LEDs, resistors, switches, or breadboards.',
};

export function CircuitChat({ onComponentMention }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([welcome]);
  const [waiting, setWaiting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const text = question.trim();
    if (!text || waiting) return;

    setQuestion('');
    setWaiting(true);
    setMessages((current) => [...current, { role: 'user', text }]);
    const mentioned = componentMention(text);
    if (mentioned) onComponentMention?.(mentioned);

    try {
      const response = await fetch('/api/devin-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Watt could not answer right now.');
      setMessages((current) => [...current, { role: 'assistant', text: payload.answer }]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: 'error', text: error.message || 'Watt could not answer right now.' },
      ]);
    } finally {
      setWaiting(false);
    }
  }

  return (
    <aside className="circuit-chat" data-open={open} aria-label="Circuit helper">
      {open && (
        <section className="circuit-chat__panel">
          <header className="circuit-chat__header">
            <div>
              <strong>Ask Watt</strong>
              <span>Powered by Devin</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close circuit helper">×</button>
          </header>

          <div className="circuit-chat__messages" aria-live="polite">
            {messages.map((message, index) => (
              <p key={`${message.role}-${index}`} data-role={message.role}>{message.text}</p>
            ))}
            {waiting && <p data-role="assistant">Thinking about your circuit…</p>}
          </div>

          <form className="circuit-chat__form" onSubmit={submit}>
            <label htmlFor="circuit-question">Ask a circuit question</label>
            <div>
              <input
                id="circuit-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Why does an LED need a resistor?"
                maxLength={500}
                disabled={waiting}
              />
              <button type="submit" disabled={waiting || !question.trim()}>Send</button>
            </div>
          </form>
        </section>
      )}

      <button
        className="circuit-chat__toggle"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span aria-hidden="true">⚡</span>
        {open ? 'Close Watt' : 'Ask Watt'}
      </button>
    </aside>
  );
}
