import { PropsWithChildren } from "react";
import { Link } from "react-router-dom";

interface AuthShellProps extends PropsWithChildren {
  title: string;
  subtitle: string;
  footerText: string;
  footerLinkLabel: string;
  footerLinkTo: string;
}

export const AuthShell = ({
  title,
  subtitle,
  footerText,
  footerLinkLabel,
  footerLinkTo,
  children
}: AuthShellProps): JSX.Element => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-100 via-amber-50 to-cyan-100 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/80 p-6 shadow-card backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>
        <div className="mt-6">{children}</div>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
          {footerText} <Link className="font-semibold text-brand-600" to={footerLinkTo}>{footerLinkLabel}</Link>
        </p>
      </div>
    </div>
  );
};