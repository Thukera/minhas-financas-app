interface PanelProps {
  title?: string;
  children?: any;
}

export const Panel: React.FC<PanelProps> = ({ title, children }) => {
  return (
    <div className="column is-full" style={{ marginBottom: "1rem" }}>
      <div className="card is-rounded px-4 has-background-dark">
        {title && (
          <header className="card-header">
            <p className="card-header-title has-text-white is-size-4">{title}</p>
          </header>
        )}
        <div className="card-content">
          <div className="content has-text-white">{children}</div>
        </div>
      </div>
    </div>
  );
};