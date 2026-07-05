export function Footer() {
  return (
    <footer className="border-t border-border py-8 px-6 no-print">
      <div className="max-w-content mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-caption text-text-tertiary">
          Built by{' '}
          <a
            href="https://www.linkedin.com/in/arnaud-chacon/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-text-primary transition-colors duration-150"
          >
            Arnaud Chacon
          </a>
          {' · '}
          <a
            href="mailto:arnaudchacon@gmail.com"
            className="text-text-secondary hover:text-text-primary transition-colors duration-150"
          >
            arnaudchacon@gmail.com
          </a>
        </p>
        <p className="text-caption text-text-tertiary">
          Data is processed in memory and never stored. No accounts, no tracking.
        </p>
      </div>
    </footer>
  );
}
