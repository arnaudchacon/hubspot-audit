export function Footer() {
  return (
    <footer className="border-t border-border py-6 px-6">
      <div className="max-w-content mx-auto flex items-center justify-between">
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
        <p className="text-caption text-text-tertiary">Open to RevOps and finance ops roles in HK / SG / KL</p>
      </div>
    </footer>
  );
}
