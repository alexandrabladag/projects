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
                sans: ['Jost', 'sans-serif'],
                serif: ['Cormorant Garamond', 'serif'],
            },
            colors: {
                app: {
                    bg:      '#0b0d14',
                    surface: '#11131d',
                    card:    '#171a28',
                    border:  '#1d2236',
                    border2: '#252b40',
                    gold:    '#c9a464',
                    cream:   '#e2dcd2',
                    cream2:  '#9a9180',
                    muted:   '#58607a',
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
