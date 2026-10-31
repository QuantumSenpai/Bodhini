module.exports = {
  darkMode: "class",

  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  presets: [require("nativewind/preset")],

  theme: {
    extend: {
      colors: {
        cream: "#F5F0E6",
        paper: "#FFFCF6",

        forest: {
          DEFAULT: "#263D31",
          dark: "#192B23",
          light: "#E5EBDD",
        },

        moss: "#879477",
        clay: "#B87352",
        ink: "#292B26",
        muted: "#77766D",
        line: "#E6DED1",
      },
    },
  },

  plugins: [],
};