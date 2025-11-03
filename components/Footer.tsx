'use client';

import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="mt-auto border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="text-center sm:text-left">
            © {new Date().getFullYear()} Typing Toy. All rights reserved.
          </div>
          <div className="flex items-center gap-1">
            <span>•</span>
            <a
              href="https://github.com/holywen/typingtoy-community/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              {t.common.reportIssues}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
