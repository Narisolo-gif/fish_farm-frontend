"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { SectionHeading } from "@/components/ui";

type DiscussionMessage = {
  id: string;
  text: string;
};

export function DiscussionWidget({
  title,
  description,
  placeholder = "Écrire un message...",
}: {
  title: string;
  description: string;
  placeholder?: string;
}) {
  const [messages, setMessages] = useState<DiscussionMessage[]>([]);
  const [draft, setDraft] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      const container = messagesContainerRef.current;
      container?.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();

    if (!text) return;

    setMessages((currentMessages) => [
      ...currentMessages,
      { id: crypto.randomUUID(), text },
    ]);
    setDraft("");
  }

  return (
    <section className="panel discussion-widget" aria-label={title}>
      <div className="discussion-widget-heading">
        <SectionHeading title={title} />
        <p>{description}</p>
      </div>

      <p className="discussion-widget-note">Simulation locale : aucun service IA n'est connecté et les messages ne sont pas conservés après rechargement.</p>

      <div ref={messagesContainerRef} className="discussion-widget-messages" role="log" aria-live="polite" aria-relevant="additions">
        {messages.length === 0 ? (
          <p className="discussion-widget-empty">La discussion est vide. Envoyez un message pour commencer.</p>
        ) : (
          messages.map((message) => (
            <article className="discussion-widget-message" key={message.id}>
              <span>Vous</span>
              <p>{message.text}</p>
            </article>
          ))
        )}
      </div>

      <form className="discussion-widget-form" onSubmit={handleSubmit}>
        <textarea
          id="discussion-message"
          aria-label="Votre message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          rows={2}
          maxLength={1200}
        />
        <button className="button button-primary" type="submit" disabled={!draft.trim()}>
          Envoyer
        </button>
      </form>
    </section>
  );
}