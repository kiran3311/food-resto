interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: JSX.Element;
}

export const PageHeader = ({ title, subtitle, actions }: PageHeaderProps): JSX.Element => (
  <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
      {subtitle ? <p className="text-sm text-slate-600 dark:text-slate-300">{subtitle}</p> : null}
    </div>
    {actions}
  </div>
);