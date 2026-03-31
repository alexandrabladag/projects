/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
        './resources/js/**/*.js',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Plus Jakarta Sans', 'sans-serif'],
                serif: ['Plus Jakarta Sans', 'sans-serif'],
            },
            colors: {
                app: {
                    bg:      '#f8f8f8',
                    surface: '#ffffff',
                    card:    '#ffffff',
                    border:  '#e5e7eb',
                    border2: '#d1d5db',
                    gold:    '#4f6df5',
                    cream:   '#000000',
                    cream2:  '#4b5563',
                    muted:   '#6b7280',
                    green:   '#3ecf8e',
                    red:     '#f56060',
                    blue:    '#5b8dee',
                    orange:  '#f0924c',
                    purple:  '#9b7fe8',
                },
            },
        },
    },
    plugins: [require('@tailwindcss/forms')],
};
