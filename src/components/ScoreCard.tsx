type ScoreCardProps = {
  label: string;
  value: number;
  dark?: boolean;
};

export function ScoreCard({ label, value, dark }: ScoreCardProps) {
  return (
    <div className={`score-card${dark ? " score-card--dark" : ""}`}>
      <span className="score-card__label">{label}</span>
      <span className="score-card__value">{value}</span>
    </div>
  );
}
