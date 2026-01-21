import React, { useEffect, useRef } from 'react';

const MatrixBackground = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*(){}[]|;:,.<>?/~`αβγδεζηθικλμνξοπρστυφχψω∑∏∫∂∇≈≠≤≥±×÷√∞';
    const columnCount = Math.floor(window.innerWidth / 20);
    
    const columns = [];
    
    for (let i = 0; i < columnCount; i++) {
      const column = document.createElement('div');
      column.className = 'matrix-column';
      column.style.left = `${(i / columnCount) * 100}%`;
      column.style.animationDuration = `${8 + Math.random() * 12}s`;
      column.style.animationDelay = `${Math.random() * 5}s`;
      column.style.opacity = Math.random() * 0.5 + 0.1;
      
      const charCount = Math.floor(Math.random() * 20) + 10;
      let content = '';
      for (let j = 0; j < charCount; j++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        content += `<span>${char}</span>`;
      }
      column.innerHTML = content;
      
      container.appendChild(column);
      columns.push(column);
    }

    // Update characters periodically
    const interval = setInterval(() => {
      columns.forEach(column => {
        const spans = column.querySelectorAll('span');
        spans.forEach(span => {
          if (Math.random() > 0.95) {
            span.textContent = chars[Math.floor(Math.random() * chars.length)];
          }
        });
      });
    }, 100);

    return () => {
      clearInterval(interval);
      columns.forEach(col => col.remove());
    };
  }, []);

  return (
    <div ref={containerRef} className="matrix-bg" aria-hidden="true">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/50 to-[#050505]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/80 via-transparent to-[#050505]/80" />
    </div>
  );
};

export default MatrixBackground;
