import { useEffect, useRef, type ReactNode } from 'react';
import { ArrowRight, BookOpen, Check, CheckCircle2, Clock3, Code2, ExternalLink, Layers3, X } from 'lucide-react';
import type { Track } from './types';

export function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return <dialog className={`modal ${wide ? 'wide' : ''}`} ref={ref} aria-labelledby="dialog-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <header className="modal-header"><h2 id="dialog-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label="Fechar janela"><X size={21} /></button></header>
    <div className="modal-body">{children}</div>
  </dialog>;
}

export function Progress({ value, label }: { value: number; label: string }) {
  return <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}><span style={{ width: `${value}%` }} /></div>;
}

export function TrackCard({ track, completed, onOpen }: { track: Track; completed: string[]; onOpen: () => void }) {
  const count = track.lessons.filter(lesson => completed.includes(lesson.id)).length;
  const percent = Math.round(count / track.lessons.length * 100);
  return <article className="track-card">
    <div className={`track-cover ${track.color}`}><span className="cover-grid" /><span className="level-tag">{track.level}</span><div className="code-emblem">{track.id === 'git' ? <Layers3 size={46} strokeWidth={1.6} /> : track.id === 'web' ? <Code2 size={55} strokeWidth={1.6} /> : <span>{track.symbol}</span>}</div><span className="cover-caption">{track.skills.join(' · ')}</span></div>
    <div className="track-body"><span className="eyebrow">{track.category}</span><h3>{track.title}</h3><p>{track.description}</p>
      <div className="meta"><span><BookOpen size={14} />{track.lessons.length} aulas</span><span><Clock3 size={14} />{track.duration}</span></div>
      <div className="progress-label"><span>{count ? `${count} de ${track.lessons.length} aulas concluídas` : 'Seu próximo começo'}</span><strong>{percent}%</strong></div><Progress value={percent} label={`Progresso em ${track.title}`} />
      <button className="track-action" onClick={onOpen}>{percent === 100 ? <><CheckCircle2 size={16} /> Revisar trilha</> : count ? 'Continuar aprendendo' : 'Explorar trilha'}<ArrowRight size={16} /></button>
    </div>
  </article>;
}

export function Empty({ icon, title, children }: { icon?: ReactNode; title: string; children: ReactNode }) {
  return <div className="empty-state">{icon}<h3>{title}</h3><p>{children}</p></div>;
}

export function External({ href, children, className = '' }: { href: string; children: ReactNode; className?: string }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}<ExternalLink size={14} /><span className="sr-only"> (abre em nova aba)</span></a>;
}

export function HeroArt() {
  return <div className="hero-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="art-spark spark-one">✦</div><div className="art-spark spark-two">✧</div><div className="floating-token token-code">&lt;/&gt;</div><div className="floating-token token-check"><Check size={23} /></div><div className="mini-browser"><div className="browser-toolbar"><i /><i /><i /><span>meu-primeiro-projeto.js</span></div><div className="browser-code"><span className="code-comment">// um passo de cada vez</span><div><b>const</b> futuro = {'{'}</div><div className="indent">curiosidade: <em>true</em>,</div><div className="indent">vontadeDeAprender: <em>∞</em></div><div>{'};'}</div><div className="code-last">futuro.<strong>começar</strong>();<span className="cursor" /></div></div></div><div className="art-note"><span>✦</span> construindo meu próximo capítulo</div></div>;
}
