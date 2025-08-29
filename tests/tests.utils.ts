export const removeKey = <T>(obj: T, key: keyof T) => {
  const { [key]: removed, ...rest } = obj;

  return rest;
};
