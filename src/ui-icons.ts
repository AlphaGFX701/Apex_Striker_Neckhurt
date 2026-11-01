const paths = {
  back: 'M15 4 7 12l8 8', next: 'm9 4 8 8-8 8',
  deploy: 'M5 19 19 5M5 5h14v14', pause: 'M8 4v16M16 4v16',
  settings: 'm12 3 2 3 4 .5.5 4 2.5 1.5-2.5 2 .5 4-4 .5-3 3-2-3-4-.5-.5-4L3 12l3-2-.5-4L10 6Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  records: 'M4 5h16M4 12h16M4 19h16',
  hull: 'm12 3 9 17-9-4-9 4Z M12 3v13',
  reset: 'M5 8a8 8 0 1 1-1 7M5 3v5h5',
};
export function uiIcon(name: keyof typeof paths) {
  return `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${paths[name]}"/></svg>`;
}
