interface StatCardProps {
  label: string;
  value: string;
}

export const StatCard = ({ label, value }: StatCardProps): JSX.Element => {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-card dark:border-slate-700 dark:bg-slate-900 dark:hover:border-brand-600/60">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 via-amber-300 to-sky-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <p className="text-xs uppercase tracking-wide text-slate-500 transition-colors duration-300 group-hover:text-slate-700 dark:group-hover:text-slate-300">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-900 transition-transform duration-300 group-hover:translate-x-1 dark:text-white">
        {value}
      </p>
    </div>
  );
};
