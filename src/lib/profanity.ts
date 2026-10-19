import filter from 'leo-profanity';

let ready = false;
export function isProfane(text: string): boolean {
  if (!ready) {
    filter.loadDictionary('en');
    ready = true;
  }
  return filter.check(text);
}
