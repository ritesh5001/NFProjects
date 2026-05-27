export const generateId = (): string => {
  const randomPart = Math.random().toString(36).slice(2, 12);
  const timePart = Date.now().toString(36);

  return `${timePart}-${randomPart}`;
};
