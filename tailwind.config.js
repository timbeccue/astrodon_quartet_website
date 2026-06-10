/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './*.html',
        './components/*.html',
        './*.js',
        './components/*.js'
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Manrope', 'sans-serif'],
            },
        }
    },
    plugins: [],
}
