import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { ConfirmProvider } from '@/Components/ui/ConfirmDialog';

const appName = import.meta.env.VITE_APP_NAME || 'ProjectFlow';

createInertiaApp({
    title: (title) => `${title} — ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <ConfirmProvider>
                <App {...props} />
            </ConfirmProvider>
        );
    },
    progress: {
        color: '#4f6df5', // gold
    },
});
