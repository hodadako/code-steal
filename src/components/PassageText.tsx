interface PassageProps {
  text: string;
  className?: string;
}

export function PassageText({ text, className = "" }: PassageProps) {
  const hasHtml = /<[a-z][\s\S]*>/i.test(text);

  if (hasHtml) {
    return (
      <div
        className={`prose-passage ${className}`}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  }

  return <div className={`prose-passage ${className}`}>{text}</div>;
}
