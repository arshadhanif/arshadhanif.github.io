// Colour per subscription category, so chips and breakdown bars read at a glance.
export const CATEGORY_COLORS = {
  'Video streaming': '#ff5c8a',
  'Music': '#4ecb71',
  'Gaming': '#b46bff',
  'Sports': '#ff8c42',
  'News & reading': '#5b9aff',
  'Cloud & storage': '#42d4d4',
  'AI & software': '#e8a838',
  'Internet & phone': '#7c8cff',
  'Shopping & memberships': '#ff6b9d',
  'Fitness & health': '#36d399',
  'Education': '#f5b50a',
  'Other': '#9aa3b4',
}
export const catColor = (c) => CATEGORY_COLORS[c] || '#9aa3b4'
